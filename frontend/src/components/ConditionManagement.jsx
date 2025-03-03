import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FaEdit, FaTrash, FaRegEdit, FaRegTrashAlt} from 'react-icons/fa';  // Additional icons for hover effect

const ConditionManagement = () => {
    const [conditions, setConditions] = useState([]);
    const [viewType, setViewType] = useState('all'); // Default view: all conditions
    const [newCondition, setNewCondition] = useState({ type: 'weather', name: '' });
    const [hoveredEdit, setHoveredEdit] = useState(null);
    const [hoveredDelete, setHoveredDelete] = useState(null);


    useEffect(() => {
        fetchConditions(viewType);
    }, [viewType]);

    const fetchConditions = async (type) => {
        try {
            let endpoint = '/conditions/all';
            if (type === 'weather') endpoint = '/conditions/weather';
            if (type === 'location') endpoint = '/conditions/location';
            if (type === 'tree') endpoint = '/conditions/tree';
            if (type === 'grouped') endpoint = '/conditions';

            const response = await api.get(endpoint);
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
            await api.post('/conditions/add', newCondition);
            fetchConditions(viewType);
            alert('Condition added successfully.');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to add condition.');
        }
    };

    const handleEditCondition = async (id, currentName, type) => {
        const updatedName = prompt('Enter new name:', currentName);
        if (!updatedName || updatedName.trim() === '') return;

        try {
            await api.put(`/conditions/${id}`, { name: updatedName, type });
            fetchConditions(viewType);
        } catch (error) {
            console.error('Error updating condition:', error);
        }
    };

    const handleDeleteCondition = async (id) => {
        if (!window.confirm('Are you sure you want to delete this condition?')) return;

        try {
            await api.delete(`/conditions/${id}`);
            fetchConditions(viewType);
        } catch (error) {
            console.error('Error deleting condition:', error);
        }
    };

    return (
        <div>
            <h2>Manage Conditions</h2>

            {/* View Type Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button onClick={() => setViewType('all')}>All</button>
                <button onClick={() => setViewType('weather')}>Weather</button>
                <button onClick={() => setViewType('location')}>Location</button>
                <button onClick={() => setViewType('tree')}>Tree</button>
            </div>

            {/* Add Condition Form */}
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}>
                <input
                    placeholder="Condition Name"
                    onChange={(e) => setNewCondition({...newCondition, name: e.target.value})}
                />
                <select onChange={(e) => setNewCondition({...newCondition, type: e.target.value})}>
                    <option value="weather">Weather</option>
                    <option value="location">Location</option>
                    <option value="tree">Tree</option>
                </select>
                <p>
                    <button onClick={handleAddCondition}>Add Condition</button>
                </p>
            </div>

            {/* Display Conditions */}
            {conditions.length === 0 ? (
                <p>No conditions found.</p>
            ) : (
                <ul>
                    {Array.isArray(conditions)
                        ? conditions.map((condition) => (
                            <li key={condition.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {condition.name}
                                <button
                                    onClick={() => handleEditCondition(condition.id, prompt('New Name:', condition.name), type)}
                                    onMouseEnter={() => setHoveredEdit(condition.id)}
                                    onMouseLeave={() => setHoveredEdit(null)}
                                    title="Edit"
                                >
                                    {hoveredEdit === condition.id ? <FaRegEdit/> : <FaEdit/>}
                                </button>
                                <button
                                    onClick={() => handleDeleteCondition(condition.id)}
                                    onMouseEnter={() => setHoveredDelete(condition.id)}
                                    onMouseLeave={() => setHoveredDelete(null)}
                                    title="Delete"
                                >
                                    {hoveredDelete === condition.id ? <FaRegTrashAlt/> : <FaTrash/>}
                                </button>
                            </li>
                        ))
                        : Object.entries(conditions).map(([type, list]) => (
                            <div key={type}>
                                <h3>{type === 'weather' ? 'Weather Conditions' : type === 'location' ? 'Location Considerations' : 'Tree Risks'}</h3>
                                {list.map((condition) => (
                                    <li key={condition.id} style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        {condition.name}
                                        <button
                                            onClick={() => handleEditCondition(condition.id, prompt('New Name:', condition.name), type)}
                                            onMouseEnter={() => setHoveredEdit(condition.id)}
                                            onMouseLeave={() => setHoveredEdit(null)}
                                            title="Edit"
                                        >
                                            {hoveredEdit === condition.id ? <FaRegEdit/> : <FaEdit/>}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCondition(condition.id)}
                                            onMouseEnter={() => setHoveredDelete(condition.id)}
                                            onMouseLeave={() => setHoveredDelete(null)}
                                            title="Delete"
                                        >
                                            {hoveredDelete === condition.id ? <FaRegTrashAlt/> : <FaTrash/>}
                                        </button>
                                    </li>
                                ))}
                            </div>
                        ))}
                </ul>
            )}
        </div>
    );
};

export default ConditionManagement;
