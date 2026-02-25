"""
Export service for generating CSV and PDF reports.
"""
import io
import csv
from typing import List, Dict, Any
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfgen import canvas


class ExportService:
    """Service for exporting data to CSV and PDF formats."""
    
    @staticmethod
    def export_orders_to_csv(orders: List[Dict[str, Any]]) -> str:
        """
        Export orders to CSV format.
        
        Args:
            orders: List of order dictionaries
            
        Returns:
            CSV content as string
        """
        output = io.StringIO()
        
        if not orders:
            return ""
        
        # Define CSV columns
        fieldnames = [
            "order_id",
            "order_number",
            "customer_name",
            "customer_email",
            "shop_name",
            "status",
            "total_amount",
            "points_earned",
            "created_at",
            "updated_at",
            "items"
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for order in orders:
            # Format items as a string
            items_str = "; ".join([
                f"{item.get('name', 'Unknown')} x {item.get('quantity', 1)}"
                for item in order.get("items", [])
            ])
            
            writer.writerow({
                "order_id": order.get("id", ""),
                "order_number": order.get("order_number", ""),
                "customer_name": order.get("customer_name", ""),
                "customer_email": order.get("customer_email", ""),
                "shop_name": order.get("shop_name", ""),
                "status": order.get("status", ""),
                "total_amount": order.get("total_amount", 0),
                "points_earned": order.get("points_earned", 0),
                "created_at": order.get("created_at", ""),
                "updated_at": order.get("updated_at", ""),
                "items": items_str
            })
        
        return output.getvalue()
    
    @staticmethod
    def export_orders_to_pdf(
        orders: List[Dict[str, Any]],
        shop_name: str = "LoyalCup"
    ) -> bytes:
        """
        Export orders to PDF format.
        
        Args:
            orders: List of order dictionaries
            shop_name: Name of the shop (for report header)
            
        Returns:
            PDF content as bytes
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#6B46C1'),
            spaceAfter=30,
        )
        title = Paragraph(f"{shop_name} - Orders Report", title_style)
        elements.append(title)
        
        # Metadata
        date_str = datetime.now().strftime("%B %d, %Y")
        metadata = Paragraph(f"<b>Generated:</b> {date_str}<br/><b>Total Orders:</b> {len(orders)}", styles['Normal'])
        elements.append(metadata)
        elements.append(Spacer(1, 20))
        
        if not orders:
            no_data = Paragraph("No orders to display.", styles['Normal'])
            elements.append(no_data)
        else:
            # Create table data
            table_data = [
                ["Order #", "Customer", "Status", "Total", "Date"]
            ]
            
            for order in orders:
                created_at = order.get("created_at", "")
                if created_at:
                    try:
                        date_obj = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                        date_str = date_obj.strftime("%m/%d/%Y")
                    except:
                        date_str = created_at
                else:
                    date_str = ""
                
                table_data.append([
                    order.get("order_number", ""),
                    order.get("customer_name", "Unknown"),
                    order.get("status", "").title(),
                    f"${order.get('total_amount', 0):.2f}",
                    date_str
                ])
            
            # Create table
            table = Table(table_data, colWidths=[1.2*inch, 2*inch, 1.2*inch, 1*inch, 1.2*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6B46C1')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F7FAFC')])
            ]))
            
            elements.append(table)
        
        # Build PDF
        doc.build(elements)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content


# Global export service instance
export_service = ExportService()
