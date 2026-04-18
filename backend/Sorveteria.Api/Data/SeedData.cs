using Microsoft.EntityFrameworkCore;
using Sorveteria.Api.Domain;

namespace Sorveteria.Api.Data;

public static class SeedData
{
    public static async Task EnsureSeedAsync(AppDbContext dbContext)
    {

        if (!await dbContext.Employees.AnyAsync())
        {
            dbContext.Employees.Add(new Employee
            {
                Name = "Admin Inicial",
                Email = "admin@sorveteria.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = UserRole.Admin,
                IsActive = true
            });
        }

        if (!await dbContext.Products.AnyAsync())
        {
            dbContext.Products.AddRange(
                new Product { Name = "Acai 300ml", Category = "Acai", BasePoints = 15, UnitPrice = 14.00m },
                new Product { Name = "Coxinha", Category = "Salgados", BasePoints = 10, UnitPrice = 8.00m },
                new Product { Name = "Suco Natural", Category = "Bebidas", BasePoints = 8, UnitPrice = 7.50m }
            );
        }

        if (!await dbContext.RewardDefinitions.AnyAsync())
        {
            dbContext.RewardDefinitions.AddRange(
                new RewardDefinition { Name = "Suco gratis", Description = "Resgate no caixa", CostPoints = 100, IsActive = true },
                new RewardDefinition { Name = "Salgado gratis", Description = "Disponivel para clientes fidelizados", CostPoints = 140, IsActive = true }
            );
        }

        if (!await dbContext.CampaignRules.AnyAsync())
        {
            dbContext.CampaignRules.AddRange(
                new CampaignRule
                {
                    Name = "Missao salgados",
                    Description = "A cada 5 salgados, libera recompensa.",
                    RuleType = CampaignRuleType.CategoryQuantity,
                    Category = "Salgados",
                    RequiredQuantity = 5,
                    RewardName = "Recompensa por 5 salgados",
                    BonusPoints = 0,
                    IsActive = true
                },
                new CampaignRule
                {
                    Name = "Meta de 100 pontos",
                    Description = "A cada 100 pontos, libera beneficio.",
                    RuleType = CampaignRuleType.PointsThreshold,
                    RequiredPoints = 100,
                    RewardName = "Beneficio 100 pontos",
                    BonusPoints = 0,
                    IsActive = true
                }
            );
        }

        await dbContext.SaveChangesAsync();
    }
}
