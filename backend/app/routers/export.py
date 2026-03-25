# routers/export.py — PDF & CSV data export

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
import csv, io
from app.database.db import get_db
from app.models.models import Activity, Nutrition, SleepLog, WaterLog, UserProfile

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/csv/{device_id}")
def export_csv(device_id: str, db: Session = Depends(get_db)):
    """Export all health data as CSV zip."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Activities
    writer.writerow(["=== ACTIVITIES ==="])
    writer.writerow(["Date","Type","Duration(min)","Calories","Steps","Notes"])
    for a in db.query(Activity).filter(Activity.device_id == device_id).order_by(Activity.date.desc()).all():
        writer.writerow([a.date, a.type, a.duration, a.calories, a.steps, a.notes])

    writer.writerow([])
    writer.writerow(["=== NUTRITION ==="])
    writer.writerow(["Date","Meal","Item","Calories","Protein(g)","Carbs(g)","Fat(g)"])
    for n in db.query(Nutrition).filter(Nutrition.device_id == device_id).order_by(Nutrition.date.desc()).all():
        writer.writerow([n.date, n.meal, n.item, n.calories, n.protein, n.carbs, n.fat])

    writer.writerow([])
    writer.writerow(["=== SLEEP ==="])
    writer.writerow(["Date","Bedtime","Wakeup","Duration(hrs)","Quality"])
    for s in db.query(SleepLog).filter(SleepLog.device_id == device_id).order_by(SleepLog.date.desc()).all():
        writer.writerow([s.date, s.bedtime, s.wakeup, s.duration, s.quality])

    writer.writerow([])
    writer.writerow(["=== WATER ==="])
    writer.writerow(["Date","Amount(L)"])
    for w in db.query(WaterLog).filter(WaterLog.device_id == device_id).order_by(WaterLog.date.desc()).all():
        writer.writerow([w.date, w.amount])

    output.seek(0)
    filename = f"vitaltrack_export_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/pdf/{device_id}")
def export_pdf(device_id: str, db: Session = Depends(get_db)):
    """Generate PDF health report using reportlab."""
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_LEFT

        buffer = io.BytesIO()
        doc    = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=0.7*inch, leftMargin=0.7*inch, topMargin=0.7*inch, bottomMargin=0.7*inch)
        story  = []
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle("Title2", parent=styles["Title"], fontSize=24, textColor=colors.HexColor("#00E5CC"), spaceAfter=6)
        h2_style    = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=14, textColor=colors.HexColor("#38BDF8"), spaceBefore=14, spaceAfter=4)
        body_style  = ParagraphStyle("Body2", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#334155"))

        # Header
        user = db.query(UserProfile).filter(UserProfile.device_id == device_id).first()
        name = user.name if user else "User"
        story.append(Paragraph("⚡ VitalTrack Pro", title_style))
        story.append(Paragraph(f"Health Report — {name} — Generated {datetime.now().strftime('%B %d, %Y')}", body_style))
        story.append(HRFlowable(width="100%", color=colors.HexColor("#00E5CC"), thickness=1.5, spaceAfter=12))

        # Summary stats
        activities = db.query(Activity).filter(Activity.device_id == device_id).all()
        nutrition  = db.query(Nutrition).filter(Nutrition.device_id == device_id).all()
        sleep_logs = db.query(SleepLog).filter(SleepLog.device_id == device_id).all()

        total_steps = sum(a.steps or 0 for a in activities)
        total_cals  = sum(a.calories or 0 for a in activities)
        avg_sleep   = round(sum(s.duration or 0 for s in sleep_logs) / max(len(sleep_logs), 1), 1)

        story.append(Paragraph("Summary Statistics", h2_style))
        summary_data = [
            ["Metric", "Value"],
            ["Total Activities Logged", str(len(activities))],
            ["Total Steps", f"{total_steps:,}"],
            ["Total Calories Burned", f"{total_cals:,} kcal"],
            ["Meals Logged", str(len(nutrition))],
            ["Sleep Entries", str(len(sleep_logs))],
            ["Average Sleep", f"{avg_sleep} hrs/night"],
        ]
        t = Table(summary_data, colWidths=[3*inch, 3*inch])
        t.setStyle(TableStyle([
            ("BACKGROUND",  (0,0), (-1,0),  colors.HexColor("#0F2347")),
            ("TEXTCOLOR",   (0,0), (-1,0),  colors.HexColor("#00E5CC")),
            ("FONTNAME",    (0,0), (-1,0),  "Helvetica-Bold"),
            ("FONTSIZE",    (0,0), (-1,-1), 10),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#F8FAFC"), colors.white]),
            ("GRID",        (0,0), (-1,-1),  0.5, colors.HexColor("#E2E8F0")),
            ("PADDING",     (0,0), (-1,-1),  6),
        ]))
        story.append(t)
        story.append(Spacer(1, 12))

        # Recent Activities
        story.append(Paragraph("Recent Activities (Last 20)", h2_style))
        act_data = [["Date", "Type", "Duration", "Calories", "Steps"]]
        for a in sorted(activities, key=lambda x: x.date, reverse=True)[:20]:
            act_data.append([a.date, a.type, f"{a.duration} min", f"{a.calories} kcal", f"{a.steps:,}"])
        if len(act_data) > 1:
            t2 = Table(act_data, colWidths=[1.2*inch, 1.4*inch, 1.1*inch, 1.2*inch, 1.1*inch])
            t2.setStyle(TableStyle([
                ("BACKGROUND",  (0,0), (-1,0), colors.HexColor("#0F2347")),
                ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
                ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
                ("FONTSIZE",    (0,0), (-1,-1), 9),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#F8FAFC"), colors.white]),
                ("GRID",        (0,0), (-1,-1), 0.3, colors.HexColor("#E2E8F0")),
                ("PADDING",     (0,0), (-1,-1), 5),
            ]))
            story.append(t2)

        doc.build(story)
        buffer.seek(0)
        filename = f"vitaltrack_report_{datetime.now().strftime('%Y%m%d')}.pdf"
        return StreamingResponse(buffer, media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"})

    except ImportError:
        return {"error": "reportlab not installed. Run: pip install reportlab"}
