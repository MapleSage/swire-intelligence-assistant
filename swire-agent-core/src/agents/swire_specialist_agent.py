from typing import Dict, List, Any, Optional
from datetime import datetime
import json

class SwireSpecialistAgent:
    """Specialized agent for Swire Renewables domain expertise"""
    
    def __init__(self):
        self.domain_knowledge = self._load_domain_knowledge()
        self.specializations = ["wind_energy", "solar_energy", "operations", "safety", "finance"]
    
    def _load_domain_knowledge(self) -> Dict[str, Any]:
        """Load Swire-specific domain knowledge"""
        return {
            "wind_energy": {
                "turbine_types": ["Vestas V150", "GE 2.5MW", "Siemens SG 3.4"],
                "maintenance_intervals": {"major": "6 months", "minor": "3 months"},
                "performance_metrics": ["capacity_factor", "availability", "turbine_efficiency"]
            },
            "solar_energy": {
                "panel_types": ["Monocrystalline", "Polycrystalline", "Thin-film"],
                "inverter_brands": ["SMA", "Fronius", "ABB"],
                "cleaning_schedule": "Monthly during dry season"
            },
            "operations": {
                "shift_patterns": ["Day: 6AM-6PM", "Night: 6PM-6AM"],
                "reporting_schedule": "Daily at 8AM and 8PM",
                "emergency_contacts": ["Site Manager", "Control Room", "Emergency Services"]
            },
            "safety": {
                "ppe_requirements": ["Hard hat", "Safety glasses", "High-vis vest", "Steel-toed boots"],
                "training_frequency": "Quarterly safety refresher",
                "incident_categories": ["Near miss", "Minor injury", "Major injury", "Environmental"]
            },
            "finance": {
                "reporting_periods": ["Monthly", "Quarterly", "Annual"],
                "key_metrics": ["Revenue", "EBITDA", "Capacity factor", "O&M costs"],
                "budget_categories": ["CAPEX", "OPEX", "Maintenance", "Insurance"]
            }
        }
    
    async def provide_specialist_insight(self, query: str, domain: str) -> Dict[str, Any]:
        """Provide specialized insights based on domain"""
        
        if domain not in self.specializations:
            return {"error": f"Domain {domain} not supported"}
        
        domain_data = self.domain_knowledge.get(domain, {})
        
        # Generate contextual response based on domain
        if domain == "wind_energy":
            return self._wind_energy_insights(query, domain_data)
        elif domain == "solar_energy":
            return self._solar_energy_insights(query, domain_data)
        elif domain == "operations":
            return self._operations_insights(query, domain_data)
        elif domain == "safety":
            return self._safety_insights(query, domain_data)
        elif domain == "finance":
            return self._finance_insights(query, domain_data)
        
        return {"response": "General Swire Renewables information", "domain": domain}
    
    def _wind_energy_insights(self, query: str, domain_data: Dict) -> Dict[str, Any]:
        """Wind energy specific insights"""
        query_lower = query.lower()
        
        if "maintenance" in query_lower:
            return {
                "response": f"Wind turbine maintenance schedule: Major maintenance every {domain_data['maintenance_intervals']['major']}, minor maintenance every {domain_data['maintenance_intervals']['minor']}",
                "turbine_types": domain_data["turbine_types"],
                "next_action": "Check maintenance logs for upcoming scheduled work"
            }
        elif "performance" in query_lower or "efficiency" in query_lower:
            return {
                "response": "Key wind farm performance metrics include capacity factor (target >35%), availability (target >97%), and turbine efficiency",
                "metrics": domain_data["performance_metrics"],
                "benchmark": "Industry average capacity factor: 35-45%"
            }
        
        return {
            "response": "Wind energy operations data available",
            "turbine_fleet": domain_data["turbine_types"],
            "domain": "wind_energy"
        }
    
    def _solar_energy_insights(self, query: str, domain_data: Dict) -> Dict[str, Any]:
        """Solar energy specific insights"""
        query_lower = query.lower()
        
        if "cleaning" in query_lower or "maintenance" in query_lower:
            return {
                "response": f"Solar panel cleaning schedule: {domain_data['cleaning_schedule']}. Regular cleaning improves efficiency by 5-15%",
                "panel_types": domain_data["panel_types"],
                "maintenance_tip": "Clean panels early morning or late evening to avoid thermal shock"
            }
        elif "inverter" in query_lower:
            return {
                "response": "Solar inverter monitoring and maintenance",
                "inverter_brands": domain_data["inverter_brands"],
                "monitoring": "Check inverter performance daily via SCADA system"
            }
        
        return {
            "response": "Solar energy operations data available",
            "technology": domain_data["panel_types"],
            "domain": "solar_energy"
        }
    
    def _operations_insights(self, query: str, domain_data: Dict) -> Dict[str, Any]:
        """Operations specific insights"""
        query_lower = query.lower()
        
        if "shift" in query_lower or "schedule" in query_lower:
            return {
                "response": "Operational shift patterns for 24/7 monitoring",
                "shifts": domain_data["shift_patterns"],
                "reporting": domain_data["reporting_schedule"]
            }
        elif "emergency" in query_lower:
            return {
                "response": "Emergency response procedures and contacts",
                "contacts": domain_data["emergency_contacts"],
                "procedure": "Follow emergency response plan in control room"
            }
        
        return {
            "response": "Operations management information",
            "shifts": domain_data["shift_patterns"],
            "domain": "operations"
        }
    
    def _safety_insights(self, query: str, domain_data: Dict) -> Dict[str, Any]:
        """Safety specific insights"""
        query_lower = query.lower()
        
        if "ppe" in query_lower or "equipment" in query_lower:
            return {
                "response": "Personal Protective Equipment requirements for all site personnel",
                "ppe_list": domain_data["ppe_requirements"],
                "compliance": "100% PPE compliance required on all sites"
            }
        elif "training" in query_lower:
            return {
                "response": f"Safety training schedule: {domain_data['training_frequency']}",
                "training_topics": ["Working at height", "Electrical safety", "Emergency procedures"],
                "certification": "All personnel must maintain current safety certifications"
            }
        elif "incident" in query_lower:
            return {
                "response": "Incident reporting and classification system",
                "categories": domain_data["incident_categories"],
                "reporting": "All incidents must be reported within 24 hours"
            }
        
        return {
            "response": "Safety management information",
            "ppe": domain_data["ppe_requirements"],
            "domain": "safety"
        }
    
    def _finance_insights(self, query: str, domain_data: Dict) -> Dict[str, Any]:
        """Finance specific insights"""
        query_lower = query.lower()
        
        if "budget" in query_lower:
            return {
                "response": "Financial budget categories and planning",
                "categories": domain_data["budget_categories"],
                "planning": "Annual budget review with quarterly updates"
            }
        elif "metrics" in query_lower or "kpi" in query_lower:
            return {
                "response": "Key financial performance indicators",
                "metrics": domain_data["key_metrics"],
                "reporting": "Monthly financial dashboard with trend analysis"
            }
        elif "reporting" in query_lower:
            return {
                "response": "Financial reporting schedule and requirements",
                "periods": domain_data["reporting_periods"],
                "compliance": "Quarterly reports to board, monthly to operations"
            }
        
        return {
            "response": "Financial management information",
            "metrics": domain_data["key_metrics"],
            "domain": "finance"
        }
    
    def get_domain_expertise(self, domain: str) -> Dict[str, Any]:
        """Get all expertise for a specific domain"""
        if domain in self.domain_knowledge:
            return {
                "domain": domain,
                "expertise": self.domain_knowledge[domain],
                "specialist": True
            }
        return {"error": f"No expertise available for domain: {domain}"}
    
    def list_specializations(self) -> List[str]:
        """List all available specializations"""
        return self.specializations