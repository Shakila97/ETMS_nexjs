namespace SchoolAttendance.Dashboard.Data;

public static class SeedData
{
    public static void Initialize(AttendanceDbContext db)
    {
        if (db.Schools.Any())
        {
            return;
        }

        var school = new School { Name = "Contoso High School" };
        var classA = new ClassRoom { Name = "Class A", School = school };
        var classB = new ClassRoom { Name = "Class B", School = school };

        var students = new List<Student>();
        for (int i = 1; i <= 25; i++)
        {
            students.Add(new Student
            {
                FirstName = $"Student{i}",
                LastName = "A",
                ClassRoom = i % 2 == 0 ? classA : classB
            });
        }

        db.Schools.Add(school);
        db.Classes.AddRange(classA, classB);
        db.Students.AddRange(students);
        db.SaveChanges();

        var today = DateOnly.FromDateTime(DateTime.Today);
        var rng = new Random(12345);
        foreach (var student in students)
        {
            for (int d = 0; d < 14; d++)
            {
                var date = today.AddDays(-d);
                // Optional: skip weekends
                if (date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                {
                    continue;
                }

                var absent = rng.NextDouble() < 0.08; // ~8% absent rate
                db.AttendanceRecords.Add(new AttendanceRecord
                {
                    StudentId = student.Id,
                    Date = date,
                    IsPresent = !absent,
                    Reason = absent ? (rng.NextDouble() < 0.5 ? "Sick" : "Family") : null
                });
            }
        }

        db.SaveChanges();
    }
}
