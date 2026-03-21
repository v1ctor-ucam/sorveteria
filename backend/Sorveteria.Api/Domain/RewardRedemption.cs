namespace Sorveteria.Api.Domain;

public class RewardRedemption
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = default!;
    public Guid? RewardDefinitionId { get; set; }
    public RewardDefinition? RewardDefinition { get; set; }
    public Guid? CampaignRuleId { get; set; }
    public CampaignRule? CampaignRule { get; set; }
    public string RewardName { get; set; } = string.Empty;
    public int CostPoints { get; set; }
    public bool IsUsed { get; set; }
    public string? GrantedReason { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAtUtc { get; set; }
}
