namespace Sorveteria.Api.Dtos;

public record CustomerOverviewResponse(
    string FullName,
    int PointsBalance,
    int Transactions,
    int RewardsAvailable
);

public record CustomerProfileResponse(
    Guid Id,
    string FullName,
    string Email,
    string Phone,
    bool IsActive,
    int PointsBalance
);

public record RewardDefinitionResponse(
    Guid Id,
    string Name,
    string? Description,
    int CostPoints,
    bool IsActive
);

public record RewardRedemptionResponse(
    Guid Id,
    string RewardName,
    int CostPoints,
    bool IsUsed,
    string? GrantedReason,
    DateTime CreatedAtUtc,
    DateTime? UsedAtUtc
);

public record LoyaltyTransactionResponse(
    Guid Id,
    int Points,
    string Type,
    string Description,
    DateTime CreatedAtUtc
);
