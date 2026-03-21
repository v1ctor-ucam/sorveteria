using Sorveteria.Api.Domain;

namespace Sorveteria.Api.Dtos;

public record DashboardSummaryResponse(
    int Customers,
    int Employees,
    int PendingSales,
    int LinkedSales,
    int ExpiredSales,
    int RewardsPendingUse
);

public record CreateEmployeeRequest(
    string Name,
    string Email,
    string Password,
    UserRole Role,
    bool IsActive
);

public record UpdateEmployeeRequest(
    string Name,
    string Email,
    UserRole Role,
    bool IsActive
);

public record UpsertRewardDefinitionRequest(
    string Name,
    string? Description,
    int CostPoints,
    bool IsActive
);

public record UpsertCampaignRuleRequest(
    string Name,
    string? Description,
    CampaignRuleType RuleType,
    string? Category,
    int RequiredQuantity,
    int RequiredPoints,
    int BonusPoints,
    string RewardName,
    bool IsActive
);
