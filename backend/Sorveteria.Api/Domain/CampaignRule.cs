namespace Sorveteria.Api.Domain;

public class CampaignRule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public CampaignRuleType RuleType { get; set; }
    public string? Category { get; set; }
    public int RequiredQuantity { get; set; }
    public int RequiredPoints { get; set; }
    public int BonusPoints { get; set; }
    public string RewardName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<RewardRedemption> RewardRedemptions { get; set; } = [];
    public List<LoyaltyTransaction> LoyaltyTransactions { get; set; } = [];
}
