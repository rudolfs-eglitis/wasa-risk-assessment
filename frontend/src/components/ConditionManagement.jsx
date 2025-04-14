import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FaRegEdit, FaRegTrashAlt, FaSave, FaTimes, FaPlusSquare } from 'react-icons/fa';
import { MdOutlineAddBox, MdDeleteOutline, MdModeEditOutline } from 'react-icons/md';

const ConditionManagement = () => {
    const [conditions, setConditions] = useState([]);
    const [viewType, setViewType] = useState('all');
    const [newCondition, setNewCondition] = useState({ type: 'weather', name: '' });
    const [hoveredEdit, setHoveredEdit] = useState(null);
    const [hoveredDelete, setHoveredDelete] = useState(null);
    const [activeAddMitigationId, setActiveAddMitigationId] = useState(null);
    const [newMitigationName, setNewMitigationName] = useState('');
    const [editingMitigationId, setEditingMitigationId] = useState(null);
    const [editingMitigationName, setEditingMitigationName] = useState('');

    useEffect(() => {
        fetchConditions(viewType);
    }, [viewType]);

    const fetchConditions = async (type) => {
        try {
            const endpoint = '/conditions/with-mitigations';
            const response = await api.get(endpoint);
            const all = response.data;
            const filtered = type === 'all' ? all : all.filter(c => c.type === type);
            setConditions(filtered);
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

    const handleAddMitigation = async (condition) => {
        try {
            const token = localStorage.getItem('token');
            await api.post('/mitigations/create', {
                name: newMitigationName,
                type: condition.type,
                conditionId: condition.id,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await fetchConditions(viewType);
            setNewMitigationName('');
            setActiveAddMitigationId(null);
        } catch (err) {
            console.error('Error adding mitigation:', err);
            alert(err.response?.data?.error || 'Failed to add mitigation.');
        }
    };

    const handleSaveMitigationEdit = async (mitigation, conditionId) => {
        if (!editingMitigationName.trim()) return;
        try {
            await api.put(`/mitigations/${mitigation.id}`, {
                name: editingMitigationName,
                type: mitigation.type
            });
            setEditingMitigationId(null);
            setEditingMitigationName('');
            await fetchConditions(viewType);
        } catch (error) {
            console.error('Error saving mitigation edit:', error);
            alert('Failed to update mitigation.');
        }
    };

    const handleDeleteMitigation = async (id) => {
        if (!window.confirm('Are you sure you want to delete this mitigation?')) return;

        try {
            await api.delete(`/mitigations/${id}`);
            await fetchConditions(viewType);
        } catch (error) {
            console.error('Error deleting mitigation:', error);
            alert('Failed to delete mitigation.');
        }
    };

    return (
        <div>
            <h2>Manage Conditions</h2>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button onClick={() => setViewType('all')}>All</button>
                <button onClick={() => setViewType('weather')}>Weather</button>
                <button onClick={() => setViewType('location')}>Location</button>
                <button onClick={() => setViewType('tree')}>Tree</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                    placeholder="Condition Name"
                    onChange={(e) => setNewCondition({ ...newCondition, name: e.target.value })}
                />
                <select onChange={(e) => setNewCondition({ ...newCondition, type: e.target.value })}>
                    <option value="weather">Weather</option>
                    <option value="location">Location</option>
                    <option value="tree">Tree</option>
                </select>
                <p>
                    <button onClick={handleAddCondition} title="Add condition">
                        Add condition
                    </button>
                </p>
            </div>

            {conditions.length === 0 ? (
                <p>No conditions found.</p>
            ) : (
                <ul>
                    {conditions.map((condition) => (
                        <li key={condition.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {condition.name}
                                <button onClick={() => handleEditCondition(condition.id, condition.name, condition.type)} title="Edit condition">
                                    <FaRegEdit />
                                </button>
                                <button title="Add mitigation" onClick={() => setActiveAddMitigationId(condition.id)}>
                                    <MdOutlineAddBox style={{ fontSize: '1.2rem' }} />
                                </button>
                                <button onClick={() => handleDeleteCondition(condition.id)} title="Delete condition">
                                    <FaRegTrashAlt />
                                </button>
                            </div>

                            {condition.mitigations && condition.mitigations.length > 0 && (
                                <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                                    {condition.mitigations.map((mitigation) => (
                                        <li key={mitigation.id} style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {editingMitigationId === mitigation.id ? (
                                                <>
                                                    <textarea
                                                        value={editingMitigationName}
                                                        onChange={(e) => setEditingMitigationName(e.target.value)}
                                                        rows={2}
                                                        style={{ resize: 'none', width: '250px' }}
                                                    />
                                                    <button onClick={() => handleSaveMitigationEdit(mitigation, condition.id)}><FaSave /></button>
                                                    <button onClick={() => setEditingMitigationId(null)}><FaTimes /></button>
                                                </>
                                            ) : (
                                                <>
                                                    – {mitigation.name}
                                                    <button onClick={() => {
                                                        setEditingMitigationId(mitigation.id);
                                                        setEditingMitigationName(mitigation.name);
                                                    }}><MdModeEditOutline /></button>
                                                    <button onClick={() => handleDeleteMitigation(mitigation.id)}><MdDeleteOutline /></button>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {activeAddMitigationId === condition.id && (
                                <div style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                                    <textarea
                                        placeholder="New mitigation name"
                                        value={newMitigationName}
                                        onChange={(e) => setNewMitigationName(e.target.value)}
                                        rows={2}
                                        style={{ resize: 'none', width: '250px' }}
                                    />
                                    <button onClick={() => handleAddMitigation(condition)}><FaSave /> Save</button>
                                    <button onClick={() => setActiveAddMitigationId(null)}><FaTimes /> Cancel</button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ConditionManagement;
