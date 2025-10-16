using Microsoft.EntityFrameworkCore;
using SchoolAttendance.Dashboard.Data;

namespace SchoolAttendance.Dashboard.Services;

public record DailySummary(int PresentCount, int AbsentCount, double AttendanceRate);
public record WeeklySummary(double AttendanceRate, int AveragePresentPerDay);
public record RecentAbsenceRow(DateOnly Date, string StudentName, string ClassName, string? Reason);

public class AttendanceMetricsService
{
    private readonly AttendanceDbContext _db;

    public AttendanceMetricsService(AttendanceDbContext db)
    {
        _db = db;
    }

    public async Task<DailySummary> GetTodaySummaryAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);

        var present = await _db.AttendanceRecords
            .AsNoTracking()
            .Where(r => r.Date == today && r.IsPresent)
            .CountAsync();

        var absent = await _db.AttendanceRecords
            .AsNoTracking()
            .Where(r => r.Date == today && !r.IsPresent)
            .CountAsync();

        var total = present + absent;
        var rate = total > 0 ? (double)present / total : 0d;
        return new DailySummary(present, absent, rate);
    }

    public async Task<WeeklySummary> GetCurrentWeekSummaryAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var startOfWeek = today.AddDays(-(int)((int)today.DayOfWeek == 0 ? 6 : (int)today.DayOfWeek - 1)); // Monday

        var daily = await _db.AttendanceRecords
            .AsNoTracking()
            .Where(r => r.Date >= startOfWeek && r.Date <= today)
            .GroupBy(r => r.Date)
            .Select(g => new
            {
                Date = g.Key,
                Present = g.Count(x => x.IsPresent),
                Absent = g.Count(x => !x.IsPresent)
            })
            .ToListAsync();

        var sumPresent = daily.Sum(x => x.Present);
        var sumAbsent = daily.Sum(x => x.Absent);
        var total = sumPresent + sumAbsent;
        var rate = total > 0 ? (double)sumPresent / total : 0d;
        var avgPresent = daily.Count > 0 ? (int)Math.Round(daily.Average(x => x.Present)) : 0;
        return new WeeklySummary(rate, avgPresent);
    }

    public async Task<List<RecentAbsenceRow>> GetRecentAbsencesAsync(int count)
    {
        var query = _db.AttendanceRecords
            .AsNoTracking()
            .Where(r => !r.IsPresent)
            .OrderByDescending(r => r.Date)
            .Take(count)
            .Select(r => new RecentAbsenceRow(
                r.Date,
                r.Student!.FirstName + " " + r.Student!.LastName,
                r.Student!.ClassRoom!.Name,
                r.Reason
            ));

        return await query.ToListAsync();
    }
}
