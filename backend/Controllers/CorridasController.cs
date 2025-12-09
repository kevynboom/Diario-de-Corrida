using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CorridaApi.Data;
using CorridaApi.Models;

namespace CorridaApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CorridasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CorridasController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Corridas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Corrida>>> GetCorridas()
        {
            return await _context.tb_corridas
                .OrderByDescending(c => c.Data)
                .ToListAsync();
        }

        // GET: api/Corridas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Corrida>> GetCorrida(int id)
        {
            var corrida = await _context.tb_corridas.FindAsync(id);

            if (corrida == null)
            {
                return NotFound();
            }

            return corrida;
        }

        // POST: api/Corridas
        [HttpPost]
        public async Task<ActionResult<Corrida>> PostCorrida(Corrida corrida)
        {
            if (corrida.DistanciaKm <= 0 || corrida.TempoMinutos <= 0)
            {
                return BadRequest("Distância e Tempo devem ser maiores que zero.");
            }

            _context.tb_corridas.Add(corrida);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCorrida), new { id = corrida.Id }, corrida);
        }

        // PUT: api/Corridas/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCorrida(int id, Corrida corrida)
        {
            if (id != corrida.Id)
            {
                return BadRequest("IDs não correspondem.");
            }

            _context.Entry(corrida).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.tb_corridas.AnyAsync(c => c.Id == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Corridas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCorrida(int id)
        {
            var corrida = await _context.tb_corridas.FindAsync(id);
            if (corrida == null)
            {
                return NotFound();
            }

            _context.tb_corridas.Remove(corrida);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}