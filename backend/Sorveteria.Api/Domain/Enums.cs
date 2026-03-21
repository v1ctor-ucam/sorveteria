namespace Sorveteria.Api.Domain;

public enum UserRole
{
    Admin = 1,
    Employee = 2,
    Customer = 3
}

public enum SaleStatus
{
    PendingLink = 1,
    Linked = 2,
    Expired = 3,
    Cancelled = 4
}

public enum LoyaltyTransactionType
{
    Earn = 1,
    Bonus = 2,
    Redemption = 3
}

public enum CampaignRuleType
{
    CategoryQuantity = 1,
    PointsThreshold = 2
}
