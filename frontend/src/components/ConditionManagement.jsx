import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FaEdit, FaTrash, FaRegEdit, FaRegTrashAlt } from 'react-icons/fa';  // Additional icons for hover effect



const ConditionManagement = () => {
    const [conditions, setConditions] = useState([]);
    const [newCondition, setNewCondition] = useState({ type: 'weather', name: '' });
    const [hoveredEdit, setHoveredEdit] = useState(null);
    const [hoveredDelete, setHoveredDelete] = useState(null);

    useEffect(() => {
        fetchConditions();
    }, []);

    const fetchConditions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/conditions', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setConditions(response.data);
        } catch (error) {
            console.error('Error fetching conditions:', error);
        }
    };

    const handleAddCondition = async () => {
        if (!newCondition.name.trim()) {
            alert('Condition name cannot be empty.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await api.post('/conditions/add', newCondition, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchConditions();
            alert('Condition added successfully.');
        } catch (error) {
            console.error('Error adding condition:', error);
        }
    };

    const handleEditCondition = async (id, newName, newType) => {
        try {
            if (newName === null || newName.trim() === '') return;
            const token = localStorage.getItem('token');
            await api.put(`/conditions/${id}`, { name: newName, type: newType }, {
            headers: { Authorization: `Bearer ${token}` },
        });
            fetchConditions();
        } catch (error) {
            console.error('Error updating condition:', error);
        }
    };

    const handleDeleteCondition = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/conditions/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchConditions();
        } catch (error) {
            console.error('Error deleting condition:', error);
        }
    };

    return (
        <div>
            <h2>Manage Conditions</h2>
            <input
                placeholder="Condition Name"
                onChange={(e) => setNewCondition({ ...newCondition, name: e.target.value })}
            />
            <select
                onChange={(e) => setNewCondition({ ...newCondition, type: e.target.value })}
            >
                <option value="weather">Weather</option>
                <option value="location">Location</option>
                <option value="tree">Tree</option>
            </select>
            <p>
                <button onClick={handleAddCondition}>Add Condition</button>
            </p>


            <ul>
                {Object.entries(conditions).map(([type, list]) => (
                    <div key={type}>
                        <h3>{type === 'weather' ? 'Weather Conditions' : type === 'location' ? 'Location Considerations' : 'Tree Risks'}</h3>
                        {list.map((condition) => (
                            <li key={condition.id}>
                                {condition.name}
                                {/* Edit Button with Hover Effect */}
                                <button
                                    onClick={() => handleEditCondition(condition.id, prompt('New Name:', condition.name), type)}
                                    onMouseEnter={() => setHoveredEdit(condition.id)}
                                    onMouseLeave={() => setHoveredEdit(null)}
                                    title="Edit"
                                >
                                    {hoveredEdit === condition.id ? <FaRegEdit /> : <FaEdit />}
                                </button>

                                {/* Delete Button with Hover Effect */}
                                <button
                                    onClick={() => handleDeleteCondition(condition.id)}
                                    onMouseEnter={() => setHoveredDelete(condition.id)}
                                    onMouseLeave={() => setHoveredDelete(null)}
                                    title="Delete"
                                >
                                    {hoveredDelete === condition.id ? <FaRegTrashAlt /> : <FaTrash />}
                                </button>
                            </li>
                        ))}
                    </div>
                ))}
            </ul>
        </div>
    );
};

export default ConditionManagement;
