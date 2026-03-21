using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sorveteria.Api.Data;
using Sorveteria.Api.Domain;
using Sorveteria.Api.Dtos;

namespace Sorveteria.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class AdminController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardSummaryResponse>> GetDashboard()
    {
        var now = DateTime.UtcNow;
        await ExpirePendingSalesAsync(now);

        var response = new DashboardSummaryResponse(
            await dbContext.Customers.CountAsync(),
            await dbContext.Employees.CountAsync(),
            await dbContext.Sales.CountAsync(x => x.Status == SaleStatus.PendingLink),
            await dbContext.Sales.CountAsync(x => x.Status == SaleStatus.Linked),
            await dbContext.Sales.CountAsync(x => x.Status == SaleStatus.Expired),
            await dbContext.RewardRedemptions.CountAsync(x => !x.IsUsed)
        );

        return Ok(response);
    }

    [HttpGet("employees")]
    public async Task<ActionResult> GetEmployees()
    {
        var employees = await dbContext.Employees
            .OrderBy(x => x.Name)
            .Select(x => new { x.Id, x.Name, x.Email, x.Role, x.IsActive, x.CreatedAtUtc })
            .ToListAsync();

        return Ok(employees);
    }

    [HttpPost("employees")]
    public async Task<ActionResult> CreateEmployee(CreateEmployeeRequest request)
    {
        if (await dbContext.Employees.AnyAsync(x => x.Email == request.Email.Trim().ToLowerInvariant()))
        {
            return Conflict("E-mail de funcionario ja cadastrado.");
        }

        var employee = new Employee
        {
            Name = request.Name,
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            IsActive = request.IsActive
        };

        dbContext.Employees.Add(employee);
        await dbContext.SaveChangesAsync();
        return Created($"/api/admin/employees/{employee.Id}", employee);
    }

    [HttpPut("employees/{id:guid}")]
    public async Task<ActionResult> UpdateEmployee(Guid id, UpdateEmployeeRequest request)
    {
        var employee = await dbContext.Employees.FirstOrDefaultAsync(x => x.Id == id);
        if (employee is null)
        {
            return NotFound();
        }

        employee.Name = request.Name;
        employee.Email = request.Email.Trim().ToLowerInvariant();
        employee.Role = request.Role;
        employee.IsActive = request.IsActive;
        await dbContext.SaveChangesAsync();
        return Ok(employee);
    }

    [HttpGet("reward-definitions")]
    public async Task<ActionResult> GetRewardDefinitions()
    {
        var rewards = await dbContext.RewardDefinitions.OrderBy(x => x.Name).ToListAsync();
        return Ok(rewards);
    }

    [HttpPost("reward-definitions")]
    public async Task<ActionResult> CreateRewardDefinition(UpsertRewardDefinitionRequest request)
    {
        var reward = new RewardDefinition
        {
            Name = request.Name,
            Description = request.Description,
            CostPoints = request.CostPoints,
            IsActive = request.IsActive
        };

        dbContext.RewardDefinitions.Add(reward);
        await dbContext.SaveChangesAsync();
        return Created($"/api/admin/reward-definitions/{reward.Id}", reward);
    }

    [HttpPut("reward-definitions/{id:guid}")]
    public async Task<ActionResult> UpdateRewardDefinition(Guid id, UpsertRewardDefinitionRequest request)
    {
        var reward = await dbContext.RewardDefinitions.FirstOrDefaultAsync(x => x.Id == id);
        if (reward is null)
        {
            return NotFound();
        }

        reward.Name = request.Name;
        reward.Description = request.Description;
        reward.CostPoints = request.CostPoints;
        reward.IsActive = request.IsActive;
        await dbContext.SaveChangesAsync();
        return Ok(reward);
    }

    [HttpGet("campaign-rules")]
    public async Task<ActionResult> GetCampaignRules()
    {
        var rules = await dbContext.CampaignRules.OrderBy(x => x.Name).ToListAsync();
        return Ok(rules);
    }

    [HttpPost("campaign-rules")]
    public async Task<ActionResult> CreateCampaignRule(UpsertCampaignRuleRequest request)
    {
        var rule = new CampaignRule
        {
            Name = request.Name,
            Description = request.Description,
            RuleType = request.RuleType,
            Category = request.Category,
            RequiredQuantity = request.RequiredQuantity,
            RequiredPoints = request.RequiredPoints,
            BonusPoints = request.BonusPoints,
            RewardName = request.RewardName,
            IsActive = request.IsActive
        };

        dbContext.CampaignRules.Add(rule);
        await dbContext.SaveChangesAsync();
        return Created($"/api/admin/campaign-rules/{rule.Id}", rule);
    }

    [HttpPut("campaign-rules/{id:guid}")]
    public async Task<ActionResult> UpdateCampaignRule(Guid id, UpsertCampaignRuleRequest request)
    {
        var rule = await dbContext.CampaignRules.FirstOrDefaultAsync(x => x.Id == id);
        if (rule is null)
        {
            return NotFound();
        }

        rule.Name = request.Name;
        rule.Description = request.Description;
        rule.RuleType = request.RuleType;
        rule.Category = request.Category;
        rule.RequiredQuantity = request.RequiredQuantity;
        rule.RequiredPoints = request.RequiredPoints;
        rule.BonusPoints = request.BonusPoints;
        rule.RewardName = request.RewardName;
        rule.IsActive = request.IsActive;
        await dbContext.SaveChangesAsync();
        return Ok(rule);
    }

    [HttpGet("reward-redemptions")]
    public async Task<ActionResult> GetRewardRedemptions([FromQuery] bool onlyPending = false)
    {
        var query = dbContext.RewardRedemptions.Include(x => x.Customer).AsQueryable();
        if (onlyPending)
        {
            query = query.Where(x => !x.IsUsed);
        }

        var result = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new
            {
                x.Id,
                Customer = x.Customer.FullName,
                x.RewardName,
                x.CostPoints,
                x.IsUsed,
                x.GrantedReason,
                x.CreatedAtUtc,
                x.UsedAtUtc
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpPost("reward-redemptions/{id:guid}/use")]
    public async Task<ActionResult> MarkRewardUsed(Guid id)
    {
        var reward = await dbContext.RewardRedemptions.FirstOrDefaultAsync(x => x.Id == id);
        if (reward is null)
        {
            return NotFound();
        }

        reward.IsUsed = true;
        reward.UsedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();
        return Ok(reward);
    }

    private async Task ExpirePendingSalesAsync(DateTime now)
    {
        var expired = await dbContext.Sales
            .Where(x => x.Status == SaleStatus.PendingLink && x.ExpiresAtUtc < now)
            .ToListAsync();

        if (expired.Count == 0)
        {
            return;
        }

        foreach (var sale in expired)
        {
            sale.Status = SaleStatus.Expired;
        }

        await dbContext.SaveChangesAsync();
    }
}
