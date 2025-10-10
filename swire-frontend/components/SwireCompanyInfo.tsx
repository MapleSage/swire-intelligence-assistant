import React from "react";
import { Wind, Zap, Globe, Users, Award, TrendingUp } from "lucide-react";

const SwireCompanyInfo: React.FC = () => {
  const stats = [
    { icon: Wind, label: "Wind Farms", value: "25+", color: "text-green-600" },
    { icon: Zap, label: "MW Capacity", value: "2,500+", color: "text-blue-600" },
    { icon: Globe, label: "Countries", value: "8", color: "text-purple-600" },
    { icon: Users, label: "Employees", value: "1,250", color: "text-orange-600" },
  ];

  const capabilities = [
    {
      title: "Renewable Energy Development",
      description: "Leading developer of wind and solar projects across Asia-Pacific",
      icon: Wind,
    },
    {
      title: "Operations & Maintenance",
      description: "24/7 monitoring and maintenance of renewable energy assets",
      icon: TrendingUp,
    },
    {
      title: "Energy Storage Solutions",
      description: "Advanced battery storage systems for grid stability",
      icon: Zap,
    },
    {
      title: "Sustainability Consulting",
      description: "Expert advisory services for corporate renewable energy",
      icon: Award,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <Wind className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Swire Renewables</h2>
        <p className="text-gray-600">
          Leading the transition to sustainable energy across Asia-Pacific
        </p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
            <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Core Capabilities */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {capabilities.map((capability, index) => (
            <div key={index} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
              <capability.icon className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{capability.title}</h4>
                <p className="text-sm text-gray-600">{capability.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Company Values */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Our Mission</h3>
        <p className="text-green-800">
          To accelerate the transition to clean energy by developing, building, and operating 
          world-class renewable energy projects that deliver sustainable value for our stakeholders 
          and communities.
        </p>
      </div>
    </div>
  );
};

export default SwireCompanyInfo;