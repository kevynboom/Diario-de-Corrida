using CorridaApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CorridaApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Corrida> tb_corridas { get; set; }
    }
}