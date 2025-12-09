using System.ComponentModel.DataAnnotations;

namespace CorridaApi.Models
{
    public class Corrida
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime Data { get; set; }

        [Required]
        public double DistanciaKm { get; set; }

        [Required]
        public int TempoMinutos { get; set; }

        public string? Local { get; set; }
    }
}