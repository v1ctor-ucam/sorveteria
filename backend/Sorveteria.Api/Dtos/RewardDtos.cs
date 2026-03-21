namespace Sorveteria.Api.Dtos;

public record RedeemRewardRequest(Guid RewardDefinitionId);

public record MarkRewardUsedRequest(bool IsUsed);

public record UpdateCustomerProfileRequest(
    string FullName,
    string Email,
    string Phone
);
