using Microsoft.EntityFrameworkCore;
using Sorveteria.Api.Data;
using Sorveteria.Api.Domain;

namespace Sorveteria.Api.Services;

public class LoyaltyService(AppDbContext dbContext)
{
    public async Task<int> ProcessSalePointsAsync(Sale sale)
    {
        if (sale.CustomerId is null)
        {
            return 0;
        }

        var items = await dbContext.SaleItems
            .Include(x => x.Product)
            .Where(x => x.SaleId == sale.Id)
            .ToListAsync();

        var basePoints = items.Sum(x => x.ItemPoints);

        var customer = await dbContext.Customers.FirstAsync(x => x.Id == sale.CustomerId.Value);
        customer.PointsBalance += basePoints;

        dbContext.LoyaltyTransactions.Add(new LoyaltyTransaction
        {
            CustomerId = customer.Id,
            SaleId = sale.Id,
            Points = basePoints,
            Type = LoyaltyTransactionType.Earn,
            Description = "Pontos por compra vinculada"
        });

        await dbContext.SaveChangesAsync();
        await ApplyCampaignRulesAsync(customer.Id);

        return basePoints;
    }

    public async Task ApplyCampaignRulesAsync(Guid customerId)
    {
        var customer = await dbContext.Customers.FirstAsync(x => x.Id == customerId);
        var rules = await dbContext.CampaignRules.Where(x => x.IsActive).ToListAsync();

        foreach (var rule in rules)
        {
            if (rule.RuleType == CampaignRuleType.CategoryQuantity)
            {
                await ApplyCategoryQuantityRuleAsync(customer, rule);
                continue;
            }

            if (rule.RuleType == CampaignRuleType.PointsThreshold)
            {
                await ApplyPointsThresholdRuleAsync(customer, rule);
            }
        }

        await dbContext.SaveChangesAsync();
    }

    public async Task<List<object>> GetCampaignProgressAsync(Guid customerId)
    {
        var customer = await dbContext.Customers.FirstAsync(x => x.Id == customerId);
        var rules = await dbContext.CampaignRules.Where(x => x.IsActive).ToListAsync();
        var progress = new List<object>();

        foreach (var rule in rules)
        {
            if (rule.RuleType == CampaignRuleType.CategoryQuantity)
            {
                var totalQty = await dbContext.SaleItems
                    .Include(x => x.Sale)
                    .Include(x => x.Product)
                    .Where(x => x.Sale.CustomerId == customerId && x.Product.Category == rule.Category)
                    .SumAsync(x => (int?)x.Quantity) ?? 0;

                progress.Add(new
                {
                    rule.Id,
                    rule.Name,
                    Type = rule.RuleType.ToString(),
                    Current = totalQty,
                    Target = rule.RequiredQuantity,
                    RewardName = rule.RewardName
                });
            }
            else
            {
                progress.Add(new
                {
                    rule.Id,
                    rule.Name,
                    Type = rule.RuleType.ToString(),
                    Current = customer.PointsBalance,
                    Target = rule.RequiredPoints,
                    RewardName = rule.RewardName
                });
            }
        }

        return progress;
    }

    private async Task ApplyCategoryQuantityRuleAsync(Customer customer, CampaignRule rule)
    {
        if (string.IsNullOrWhiteSpace(rule.Category) || rule.RequiredQuantity <= 0)
        {
            return;
        }

        var totalQty = await dbContext.SaleItems
            .Include(x => x.Sale)
            .Include(x => x.Product)
            .Where(x => x.Sale.CustomerId == customer.Id && x.Product.Category == rule.Category)
            .SumAsync(x => (int?)x.Quantity) ?? 0;

        var achievedCycles = totalQty / rule.RequiredQuantity;
        var grantedCycles = await dbContext.RewardRedemptions.CountAsync(x => x.CustomerId == customer.Id && x.CampaignRuleId == rule.Id);

        for (var currentCycle = grantedCycles; currentCycle < achievedCycles; currentCycle++)
        {
            dbContext.RewardRedemptions.Add(new RewardRedemption
            {
                CustomerId = customer.Id,
                CampaignRuleId = rule.Id,
                RewardName = rule.RewardName,
                CostPoints = 0,
                IsUsed = false,
                GrantedReason = $"Campanha: {rule.Name}"
            });

            if (rule.BonusPoints > 0)
            {
                customer.PointsBalance += rule.BonusPoints;
                dbContext.LoyaltyTransactions.Add(new LoyaltyTransaction
                {
                    CustomerId = customer.Id,
                    CampaignRuleId = rule.Id,
                    Points = rule.BonusPoints,
                    Type = LoyaltyTransactionType.Bonus,
                    Description = $"Bonus da campanha {rule.Name}"
                });
            }
        }
    }

    private async Task ApplyPointsThresholdRuleAsync(Customer customer, CampaignRule rule)
    {
        if (rule.RequiredPoints <= 0)
        {
            return;
        }

        var achievedCycles = customer.PointsBalance / rule.RequiredPoints;
        var grantedCycles = await dbContext.RewardRedemptions.CountAsync(x => x.CustomerId == customer.Id && x.CampaignRuleId == rule.Id);

        for (var currentCycle = grantedCycles; currentCycle < achievedCycles; currentCycle++)
        {
            dbContext.RewardRedemptions.Add(new RewardRedemption
            {
                CustomerId = customer.Id,
                CampaignRuleId = rule.Id,
                RewardName = rule.RewardName,
                CostPoints = 0,
                IsUsed = false,
                GrantedReason = $"Meta de pontos: {rule.Name}"
            });
        }
    }
}
