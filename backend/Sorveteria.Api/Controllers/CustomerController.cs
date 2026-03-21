using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sorveteria.Api.Data;
using Sorveteria.Api.Domain;
using Sorveteria.Api.Dtos;
using Sorveteria.Api.Services;

namespace Sorveteria.Api.Controllers;

[ApiController]
[Route("api/customer")]
[Authorize(Roles = nameof(UserRole.Customer))]
public class CustomerController(AppDbContext dbContext, LoyaltyService loyaltyService) : ControllerBase
{
    [HttpPost("link-sale")]
    public async Task<ActionResult> LinkSaleByQr(LinkSaleByQrRequest request)
    {
        var customerId = GetAuthenticatedCustomerId();

        var sale = await dbContext.Sales
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.QrToken == request.QrToken);

        if (sale is null)
        {
            return NotFound("Compra nao encontrada.");
        }

        if (sale.Status != SaleStatus.PendingLink)
        {
            return BadRequest("Esta compra ja foi processada ou nao esta disponivel.");
        }

        if (DateTime.UtcNow > sale.ExpiresAtUtc)
        {
            sale.Status = SaleStatus.Expired;
            await dbContext.SaveChangesAsync();
            return BadRequest("QR Code expirado.");
        }

        sale.CustomerId = customerId;
        sale.LinkedAtUtc = DateTime.UtcNow;
        sale.LinkIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        sale.Status = SaleStatus.Linked;

        await dbContext.SaveChangesAsync();
        var earnedPoints = await loyaltyService.ProcessSalePointsAsync(sale);

        return Ok(new
        {
            Message = "Compra vinculada com sucesso.",
            sale.Id,
            sale.LinkedAtUtc,
            EarnedPoints = earnedPoints
        });
    }

    [HttpGet("overview")]
    public async Task<ActionResult<CustomerOverviewResponse>> GetOverview()
    {
        var customerId = GetAuthenticatedCustomerId();

        var customer = await dbContext.Customers.FirstAsync(x => x.Id == customerId);
        var txCount = await dbContext.LoyaltyTransactions.CountAsync(x => x.CustomerId == customerId);
        var rewards = await dbContext.RewardRedemptions.CountAsync(x => x.CustomerId == customerId && !x.IsUsed);

        return Ok(new CustomerOverviewResponse(customer.FullName, customer.PointsBalance, txCount, rewards));
    }

    [HttpGet("profile")]
    public async Task<ActionResult<CustomerProfileResponse>> GetProfile()
    {
        var customerId = GetAuthenticatedCustomerId();
        var customer = await dbContext.Customers.FirstAsync(x => x.Id == customerId);

        return Ok(new CustomerProfileResponse(
            customer.Id,
            customer.FullName,
            customer.Email,
            customer.Phone,
            customer.IsActive,
            customer.PointsBalance
        ));
    }

    [HttpPut("profile")]
    public async Task<ActionResult> UpdateProfile(UpdateCustomerProfileRequest request)
    {
        var customerId = GetAuthenticatedCustomerId();
        var customer = await dbContext.Customers.FirstAsync(x => x.Id == customerId);

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedPhone = request.Phone.Trim();

        var emailInUse = await dbContext.Customers.AnyAsync(x => x.Id != customerId && x.Email == normalizedEmail);
        if (emailInUse)
        {
            return Conflict("E-mail ja esta em uso.");
        }

        var phoneInUse = await dbContext.Customers.AnyAsync(x => x.Id != customerId && x.Phone == normalizedPhone);
        if (phoneInUse)
        {
            return Conflict("Telefone ja esta em uso.");
        }

        customer.FullName = request.FullName.Trim();
        customer.Email = normalizedEmail;
        customer.Phone = normalizedPhone;

        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("history")]
    public async Task<ActionResult> GetPurchaseHistory()
    {
        var customerId = GetAuthenticatedCustomerId();

        var purchases = await dbContext.Sales
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.LinkedAtUtc)
            .Select(x => new
            {
                x.Id,
                x.QrToken,
                x.CreatedAtUtc,
                x.LinkedAtUtc,
                x.TotalAmount,
                x.Status
            })
            .ToListAsync();

        return Ok(purchases);
    }

    [HttpGet("loyalty-transactions")]
    public async Task<ActionResult> GetLoyaltyTransactions()
    {
        var customerId = GetAuthenticatedCustomerId();

        var items = await dbContext.LoyaltyTransactions
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new LoyaltyTransactionResponse(
                x.Id,
                x.Points,
                x.Type.ToString(),
                x.Description,
                x.CreatedAtUtc
            ))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("campaign-progress")]
    public async Task<ActionResult> GetCampaignProgress()
    {
        var customerId = GetAuthenticatedCustomerId();
        var progress = await loyaltyService.GetCampaignProgressAsync(customerId);
        return Ok(progress);
    }

    [HttpGet("rewards")]
    public async Task<ActionResult> GetRewards()
    {
        var customerId = GetAuthenticatedCustomerId();

        var definitions = await dbContext.RewardDefinitions
            .Where(x => x.IsActive)
            .OrderBy(x => x.CostPoints)
            .Select(x => new RewardDefinitionResponse(x.Id, x.Name, x.Description, x.CostPoints, x.IsActive))
            .ToListAsync();

        var redemptions = await dbContext.RewardRedemptions
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new RewardRedemptionResponse(
                x.Id,
                x.RewardName,
                x.CostPoints,
                x.IsUsed,
                x.GrantedReason,
                x.CreatedAtUtc,
                x.UsedAtUtc
            ))
            .ToListAsync();

        return Ok(new { definitions, redemptions });
    }

    [HttpPost("rewards/redeem")]
    public async Task<ActionResult> RedeemReward(RedeemRewardRequest request)
    {
        var customerId = GetAuthenticatedCustomerId();
        var customer = await dbContext.Customers.FirstAsync(x => x.Id == customerId);
        var definition = await dbContext.RewardDefinitions.FirstOrDefaultAsync(x => x.Id == request.RewardDefinitionId && x.IsActive);

        if (definition is null)
        {
            return NotFound("Recompensa nao encontrada.");
        }

        if (customer.PointsBalance < definition.CostPoints)
        {
            return BadRequest("Pontos insuficientes para resgate.");
        }

        customer.PointsBalance -= definition.CostPoints;

        dbContext.RewardRedemptions.Add(new RewardRedemption
        {
            CustomerId = customerId,
            RewardDefinitionId = definition.Id,
            RewardName = definition.Name,
            CostPoints = definition.CostPoints,
            IsUsed = false,
            GrantedReason = "Resgate por pontos"
        });

        dbContext.LoyaltyTransactions.Add(new LoyaltyTransaction
        {
            CustomerId = customerId,
            Points = -definition.CostPoints,
            Type = LoyaltyTransactionType.Redemption,
            Description = $"Resgate da recompensa {definition.Name}"
        });

        await dbContext.SaveChangesAsync();
        return Ok(new { message = "Recompensa resgatada com sucesso." });
    }

    private Guid GetAuthenticatedCustomerId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(id, out var customerId))
        {
            throw new UnauthorizedAccessException("Token invalido.");
        }

        return customerId;
    }
}
