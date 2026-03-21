namespace Sorveteria.Api.Domain;

public class Customer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int PointsBalance { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<Sale> Sales { get; set; } = [];
    public List<LoyaltyTransaction> LoyaltyTransactions { get; set; } = [];
    public List<RewardRedemption> RewardRedemptions { get; set; } = [];
}
