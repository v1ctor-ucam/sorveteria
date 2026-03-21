using Microsoft.EntityFrameworkCore;
using Sorveteria.Api.Domain;

namespace Sorveteria.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<LoyaltyTransaction> LoyaltyTransactions => Set<LoyaltyTransaction>();
    public DbSet<RewardRedemption> RewardRedemptions => Set<RewardRedemption>();
    public DbSet<RewardDefinition> RewardDefinitions => Set<RewardDefinition>();
    public DbSet<CampaignRule> CampaignRules => Set<CampaignRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasIndex(x => x.Phone).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(160);
            entity.Property(x => x.Phone).HasMaxLength(20);
            entity.Property(x => x.FullName).HasMaxLength(140);
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(140);
            entity.Property(x => x.Email).HasMaxLength(160);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120);
            entity.Property(x => x.Category).HasMaxLength(40);
            entity.Property(x => x.UnitPrice).HasPrecision(10, 2);
        });

        modelBuilder.Entity<RewardDefinition>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120);
        });

        modelBuilder.Entity<CampaignRule>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120);
            entity.Property(x => x.Category).HasMaxLength(40);
            entity.Property(x => x.RewardName).HasMaxLength(120);
        });

        modelBuilder.Entity<Sale>(entity =>
        {
            entity.HasIndex(x => x.QrToken).IsUnique();
            entity.Property(x => x.TotalAmount).HasPrecision(10, 2);
            entity.Property(x => x.QrToken).HasMaxLength(120);

            entity.HasOne(x => x.Employee)
                .WithMany(x => x.Sales)
                .HasForeignKey(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Customer)
                .WithMany(x => x.Sales)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SaleItem>(entity =>
        {
            entity.Property(x => x.UnitPriceSnapshot).HasPrecision(10, 2);
            entity.HasOne(x => x.Sale).WithMany(x => x.Items).HasForeignKey(x => x.SaleId);
            entity.HasOne(x => x.Product).WithMany(x => x.SaleItems).HasForeignKey(x => x.ProductId);
        });

        modelBuilder.Entity<LoyaltyTransaction>(entity =>
        {
            entity.HasOne(x => x.Customer)
                .WithMany(x => x.LoyaltyTransactions)
                .HasForeignKey(x => x.CustomerId);

            entity.HasOne(x => x.Sale)
                .WithMany()
                .HasForeignKey(x => x.SaleId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.CampaignRule)
                .WithMany(x => x.LoyaltyTransactions)
                .HasForeignKey(x => x.CampaignRuleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RewardRedemption>(entity =>
        {
            entity.HasOne(x => x.Customer)
                .WithMany(x => x.RewardRedemptions)
                .HasForeignKey(x => x.CustomerId);

            entity.HasOne(x => x.RewardDefinition)
                .WithMany(x => x.RewardRedemptions)
                .HasForeignKey(x => x.RewardDefinitionId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.CampaignRule)
                .WithMany(x => x.RewardRedemptions)
                .HasForeignKey(x => x.CampaignRuleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        base.OnModelCreating(modelBuilder);
    }
}
