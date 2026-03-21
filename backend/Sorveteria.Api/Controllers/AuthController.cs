using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sorveteria.Api.Data;
using Sorveteria.Api.Domain;
using Sorveteria.Api.Dtos;
using Sorveteria.Api.Services;

namespace Sorveteria.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext dbContext, TokenService tokenService) : ControllerBase
{
    [HttpPost("register-customer")]
    public async Task<ActionResult<AuthResponse>> RegisterCustomer(RegisterCustomerRequest request)
    {
        var emailExists = await dbContext.Customers.AnyAsync(x => x.Email == request.Email);
        if (emailExists)
        {
            return Conflict("E-mail ja cadastrado.");
        }

        var phoneExists = await dbContext.Customers.AnyAsync(x => x.Phone == request.Phone);
        if (phoneExists)
        {
            return Conflict("Telefone ja cadastrado.");
        }

        var customer = new Customer
        {
            FullName = request.FullName,
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = request.Phone.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = true
        };

        dbContext.Customers.Add(customer);
        await dbContext.SaveChangesAsync();

        var token = tokenService.CreateToken(customer.Id, customer.Email, UserRole.Customer);
        return Ok(new AuthResponse(token, DateTime.UtcNow.AddHours(3), UserRole.Customer.ToString()));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var normalizedLogin = request.Login.Trim().ToLowerInvariant();

        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(x => x.Email == normalizedLogin || x.Phone == request.Login);

        if (customer is not null && customer.IsActive && BCrypt.Net.BCrypt.Verify(request.Password, customer.PasswordHash))
        {
            var customerToken = tokenService.CreateToken(customer.Id, customer.Email, UserRole.Customer);
            return Ok(new AuthResponse(customerToken, DateTime.UtcNow.AddHours(3), UserRole.Customer.ToString()));
        }

        var employee = await dbContext.Employees.FirstOrDefaultAsync(x => x.Email == normalizedLogin);
        if (employee is not null && employee.IsActive && BCrypt.Net.BCrypt.Verify(request.Password, employee.PasswordHash))
        {
            var employeeToken = tokenService.CreateToken(employee.Id, employee.Email, employee.Role);
            return Ok(new AuthResponse(employeeToken, DateTime.UtcNow.AddHours(3), employee.Role.ToString()));
        }

        return Unauthorized("Credenciais invalidas.");
    }
}
