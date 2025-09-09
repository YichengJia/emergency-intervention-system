import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Calendar, Phone, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EmergencyTracker({ client, patient }) {
  const [encounters, setEncounters] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [riskFactors, setRiskFactors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmergencyData();
  }, [client, patient.id]);

  const fetchEmergencyData = async () => {
    try {
      // Fetch emergency encounters from last 2 years
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const bundle = await client.request(
        `Encounter?patient=${patient.id}&class=EMER&date=ge${twoYearsAgo.toISOString().split('T')[0]}&_sort=-date`
      );

      const emergencyVisits = bundle.entry?.map(e => e.resource) || [];
      setEncounters(emergencyVisits);

      // Process data for chart
      const monthlyData = processMonthlyVisits(emergencyVisits);
      setChartData(monthlyData);

      // Analyze risk factors
      const risks = analyzeRiskFactors(emergencyVisits);
      setRiskFactors(risks);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching emergency data:', error);
      setLoading(false);
    }
  };

  const processMonthlyVisits = (visits) => {
    const monthCounts = {};
    const now = new Date();

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[key] = 0;
    }

    // Count visits per month
    visits.forEach(visit => {
      if (visit.period?.start) {
        const visitDate = new Date(visit.period.start);
        const key = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthCounts.hasOwnProperty(key)) {
          monthCounts[key]++;
        }
      }
    });

    return Object.entries(monthCounts).map(([month, count]) => ({
      month: month.slice(5) + '/' + month.slice(2, 4),
      visits: count
    }));
  };

  const analyzeRiskFactors = (visits) => {
    const factors = [];
    const totalVisits = visits.length;
    const lastYear = visits.filter(v => {
      const visitDate = new Date(v.period?.start);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return visitDate > oneYearAgo;
    }).length;

    if (lastYear >= 4) {
      factors.push({
        level: 'high',
        text: `${lastYear} ED visits in the past year (threshold: 4)`,
        icon: 'alert'
      });
    }

    if (totalVisits >= 8) {
      factors.push({
        level: 'high',
        text: `${totalVisits} ED visits in the past 2 years (threshold: 8)`,
        icon: 'trend'
      });
    }

    // Check for recent frequent visits
    const lastMonth = visits.filter(v => {
      const visitDate = new Date(v.period?.start);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return visitDate > oneMonthAgo;
    }).length;

    if (lastMonth >= 2) {
      factors.push({
        level: 'urgent',
        text: `${lastMonth} ED visits in the past month - immediate intervention needed`,
        icon: 'urgent'
      });
    }

    return factors;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Emergency Department Visit Tracker
        </h1>
        <p className="text-gray-600">
          Monitor and reduce unnecessary emergency department visits
        </p>
      </div>

      {/* Risk Assessment */}
      {riskFactors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold text-red-900">Risk Assessment</h2>
          </div>
          <ul className="space-y-2">
            {riskFactors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span className="text-red-800">{factor.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Visit Trend Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Visit Trends</h2>
          <TrendingUp className="h-5 w-5 text-gray-500" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="visits"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Visits */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Recent Emergency Visits
        </h2>
        {encounters.length === 0 ? (
          <p className="text-gray-600">No emergency visits found in the past 2 years</p>
        ) : (
          <div className="space-y-3">
            {encounters.slice(0, 5).map((encounter, idx) => (
              <div key={idx} className="border-l-4 border-gray-300 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(encounter.period?.start).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Reason: {encounter.reasonCode?.[0]?.text || 'Not specified'}
                    </p>
                    {encounter.hospitalization && (
                      <p className="text-sm text-orange-600">
                        Resulted in admission
                      </p>
                    )}
                  </div>
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alternatives to ED */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          Before Going to the Emergency Department
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="font-medium text-blue-900">Call Your Primary Care Provider</p>
              <p className="text-sm text-blue-700">
                Many issues can be handled by your regular doctor, often same-day
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="font-medium text-blue-900">Use Urgent Care for Non-Emergencies</p>
              <p className="text-sm text-blue-700">
                Urgent care centers can treat minor injuries and illnesses
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="font-medium text-blue-900">24/7 Nurse Hotline</p>
              <p className="text-sm text-blue-700">
                Get professional medical advice to determine if ED visit is necessary
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg">
          <p className="text-sm font-semibold text-red-600 mb-2">
            Call 911 or go to ED immediately for:
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Chest pain or difficulty breathing</li>
            <li>• Signs of stroke (face drooping, arm weakness, speech difficulty)</li>
            <li>• Severe bleeding or head injury</li>
            <li>• Loss of consciousness</li>
          </ul>
        </div>
      </div>
    </div>
  );
}