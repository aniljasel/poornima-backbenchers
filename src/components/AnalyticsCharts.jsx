import React from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const UserGrowthChart = ({ data }) => (
    <div className="glass p-6 rounded-xl">
        <h3 className="text-lg font-bold mb-4 text-gray-200">User Growth</h3>
        <div style={{ height: 300, width: '100%', minWidth: 0, position: 'relative' }}>
            <ResponsiveContainer width="99%" height="100%" debounce={200}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export const SubjectDistributionChart = ({ data }) => (
    <div className="glass p-6 rounded-xl">
        <h3 className="text-lg font-bold mb-4 text-gray-200">Notes by Subject</h3>
        <div style={{ height: 300, width: '100%', minWidth: 0, position: 'relative' }}>
            <ResponsiveContainer width="99%" height="100%" debounce={200}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="subject" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export const UserStatusChart = ({ data }) => (
    <div className="glass p-6 rounded-xl">
        <h3 className="text-lg font-bold mb-4 text-gray-200">User Status</h3>
        <div style={{ height: 300, width: '100%', minWidth: 0, position: 'relative' }}>
            <ResponsiveContainer width="99%" height="100%" debounce={200}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </div>
);
