import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api'; // Use the global API instance
import { useLoadScript } from '@react-google-maps/api';
import { hospitals } from '../data/hospitals'; // Import hospital data
import moment from 'moment';

const libraries = ['places']; // Load the Places library for Autocomplete

const RiskAssessmentForm = () => {
    const [jobSiteLocation, setJobSiteLocation] = useState({ address: '', lat: '', lng: '' });
    const [isAutoDetect, setIsAutoDetect] = useState(false);
    const autocompleteRef = useRef(null); // Always initialize the ref
    const inputRef = useRef(null); // Ref for the input field

    const [nearestHospital, setNearestHospital] = useState(null);

    const [users, setUsers] = useState([]);
    const [onSiteArborists, setOnSiteArborists] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const [weatherConditions, setWeatherConditions] = useState(['Good']); // Default: "Good"
    const [weatherApproval, setWeatherApproval] = useState(false); // Track confirmation checkbox

    const [methodsOfWork, setMethodsOfWork] = useState([]);

    const [locationRisks, setLocationRisks] = useState([]);

    const [onSiteMachinery, setOnSiteMachinery] = useState([]);

    const [treeRisks, setTreeRisks] = useState(['No remarks']);
    const [treeRisksApproved, setTreeRisksApproved] = useState(false);

    const [carKeyLocation, setCarKeyLocation] = useState('');
    const [additionalRisks, setAdditionalRisks] = useState('');
    const [safetyApproval, setSafetyApproval] = useState(false); // For PPE/plan confirmation
    const [teamLeader, setTeamLeader] = useState(null);

    const [errors, setErrors] = useState({}); // Error state for form validation


    // Load the Google Maps Places API
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY, // Use your Google Maps API Key
        libraries,
    });

    useEffect(() => {
        if (isLoaded && inputRef.current && !autocompleteRef.current) {
            // Initialize Google Places Autocomplete
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                types: ['geocode'], // Only suggest addresses
                componentRestrictions: { country: 'se' }, // Restrict to Sweden
                fields: ['formatted_address', 'geometry'], // Only fetch address and geometry data
            });

            autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
        }
    }, [isLoaded]); // Ensure this effect runs only after the Google API is loaded

    const handlePlaceSelect = () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry) {
            setJobSiteLocation({
                address: place.formatted_address,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
            });
        }
    };

    const handleToggleDetectLocation = async (e) => {
        const autoDetectEnabled = e.target.checked;
        setIsAutoDetect(autoDetectEnabled);

        if (autoDetectEnabled) {
            // Automatically detect location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;

                        // Update lat/lng and fetch the address
                        setJobSiteLocation({
                            lat,
                            lng,
                            address: '', // Temporarily clear the address until reverse geocoding completes
                        });

                        await fetchAddressFromCoordinates(lat, lng); // Fetch the human-readable address
                    },
                    (error) => {
                        console.error('Error detecting location:', error.message);
                        alert('Failed to detect location. Please enable location services.');
                    }
                );
            } else {
                alert('Geolocation is not supported by your browser.');
            }
        } else {
            // Disable automatic detection and allow manual entry
            setJobSiteLocation((prev) => ({
                ...prev,
                lat: '',
                lng: '',
                address: '', // Clear the auto-detected address
            }));
        }
    };


    const fetchAddressFromCoordinates = async (lat, lng) => {
        try {
            const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY; // Use your Google Maps API Key
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
            const response = await api.get(geocodeUrl);

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const address = response.data.results[0].formatted_address;
                setJobSiteLocation((prev) => ({
                    ...prev,
                    address: address, // Update the address with the reverse geocoded result
                }));
            } else {
                console.error('Failed to fetch address:', response.data.error_message || response.data.status);
            }
        } catch (error) {
            console.error('Error fetching address:', error.message);
        }
    };


    useEffect(() => {
        fetchUsers();
        fetchCurrentUser();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/users/arborists', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };
    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            setCurrentUser(decodedToken); // Assumes the token contains user details
            setOnSiteArborists([decodedToken.id]); // Pre-select current user
            setTeamLeader(String(decodedToken.id)); // Automatically select current user as team leader
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    };

    const toggleArborist = (id) => {
        if (id === currentUser.id) {
            // Prevent unchecking the current user
            return;
        }
        setOnSiteArborists((prev) =>
            prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
        );
    };


    useEffect(() => {
        if (jobSiteLocation.lat && jobSiteLocation.lng) {
            fetchAddressFromCoordinates(jobSiteLocation.lat, jobSiteLocation.lng);
        }
    }, [jobSiteLocation.lat, jobSiteLocation.lng]);


    useEffect(() => {
        if (jobSiteLocation.lat && jobSiteLocation.lng) {
            findNearestHospital(jobSiteLocation.lat, jobSiteLocation.lng);
        }
    }, [jobSiteLocation]);


    const detectLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setJobSiteLocation({
                    address: `Lat: ${latitude.toFixed(7)}, Lng: ${longitude.toFixed(7)}`,
                    lat: latitude.toFixed(7),
                    lng: longitude.toFixed(7),
                });
            },
            (error) => {
                alert(`Could not retrieve location: ${error.message}`);
            }
        );
    };

    const findNearestHospital = (lat, lng) => {
        let nearest = null;
        let minDistance = Infinity;

        hospitals.forEach((hospital) => {
            const distance = calculateDistance(lat, lng, hospital.lat, hospital.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = hospital;
            }
        });

        setNearestHospital(nearest);
    };

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const toRadians = (deg) => (deg * Math.PI) / 180;
        const earthRadiusKm = 6371;

        const dLat = toRadians(lat2 - lat1);
        const dLng = toRadians(lng2 - lng1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    };


    const handleManualAddressChange = (e) => {
        const { name, value } = e.target;
        setJobSiteLocation((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCarKeyLocationChange = (e) => {
        setCarKeyLocation(e.target.value);
    };

    // Additional Risks
    const handleAdditionalRisksChange = (e) => {
        setAdditionalRisks(e.target.value);
    };

    // Safety Approval for PPE and work plan
    const handleSafetyApprovalChange = (e) => {
        setSafetyApproval(e.target.checked);
    };

    // Team Leader selection (radio button group)
    const handleTeamLeaderChange = (e) => {
        setTeamLeader(e.target.value);
    };



    const weatherOptions = [
        'Good',
        'Wind',
        'Rain',
        'Snow',
        'Hail',
        'Thunder/Lightning',
        'Extreme Heat',
        'Extreme Cold',
        'Ice',
        'Fog',
    ];

    const methodsOfWorkOptions = ['Ground felling', 'Section felling', 'Rigging', 'Pruning', 'Hedge trimming', 'Stump grinding', 'Planting', 'Root excavation']

    const treeRiskOptions = [
        'No remarks',
        'Broken/Dead/Loose branches',
        'Dead tree',
        'Defect root system',
        'Fruiting bodies',
        'Fungi',
        'Cracks',
        'Mechanical damage',
        'Soil disturbance',
        'Cavities',
        'Included bark',
        'Wildlife',
    ];
    const locationRiskOptions = [
        'Private garden',
        'BRF',
        'School area',
        'Street',
        'Walking/Cycling path',
        'Parking area',
        'Cables',
        'Electricity wires',
        'Construction site',
        'Railroad',
        'Forest',
    ];
    const machineryOptions = [
        'Chipper',
        'Avant',
        'Crane Truck',
        'Stump Grinder',
        'Airspade/Compressor',
        'Skylift',
        'Crane',
    ];

    const handleWeatherChange = (condition) => {
        setWeatherApproval(false); // Reset the approval checkbox if weather conditions change

        setWeatherConditions((prev) => {
            if (condition === 'Good') {
                // If "Good" is selected, remove all other conditions
                return prev.includes('Good') ? prev : ['Good'];
            } else {
                // If any other condition is selected, remove "Good" and add the new condition
                return [...prev.filter((c) => c !== 'Good'), condition];
            }
        });
    };


    const validateForm = () => {
        const validationErrors = {};

        // Address validation
        if (!jobSiteLocation.address) {
            validationErrors.address = 'Job site address is required.';
        }

        if (!teamLeader) {
            validationErrors.teamLeader = 'Team leader must be selected.';
        }

        // On-Site Arborists validation
        if (onSiteArborists.length === 0) {
            validationErrors.arborists = 'At least one arborist must be selected.';
        }

        // If "Good" is not selected, ensure the weather confirmation checkbox is checked
        if (!weatherConditions.includes('Good') && !weatherApproval) {
            validationErrors.weatherApproval = 'Confirm that the work can proceed safely despite weather conditions, reschedule otherwise';
        }

        if (!safetyApproval) {
            validationErrors.safetyApproval = 'Safety approval is required.';
        }

        // Validate tree risks: if any risk other than "No remarks" is selected, confirmation must be checked.
        if (treeRisks.some((risk) => risk !== 'No remarks') && !treeRisksApproved) {
            validationErrors.treeRisks = 'Confirm that the work can proceed safely despite tree risks, reschedule otherwise';
        }

        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        const formErrors = validateForm();

        // Run validation
        if (!validateForm()) {
            console.error('Form validation failed.');
            return; // Block form submission if validation fails
        }

        const formData = {
            jobSiteLocation,
            nearestHospital,
            onSiteArborists,
            weatherConditions,
            methodsOfWork,
            locationRisks,
            treeRisks,
            carKeyLocation,
            additionalRisks,
            safetyApproval,
            teamLeader,
        };

        try {
            const token = localStorage.getItem('token');
            const response = await api.post('/assessments/create', formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert(response.data.message);
            window.location.href = '/today'; // Redirect after submission
        } catch (error) {
            console.error('Error submitting form:', error.response?.data || error.message);
            alert('Failed to submit the form.');
        }
    };



    return (
        <form onSubmit={handleSubmit} method="POST">
            <h2>Risk assessment form</h2>
            <h3>Job Site Location</h3>
            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={isAutoDetect}
                        onChange={handleToggleDetectLocation}
                    />
                    Automatically Detect Location
                </label>

                {/* Autocomplete Input */}
                <div>
                    <input
                        type="text"
                        placeholder="Enter address manually"
                        ref={inputRef} // Ref to the input field
                        value={jobSiteLocation.address}
                        onChange={(e) =>
                            setJobSiteLocation((prev) => ({...prev, address: e.target.value}))
                        }
                        disabled={isAutoDetect} // Disable manual input when auto-detect is active
                    />
                    {errors.address && <p style={{ color: 'red' }}>{errors.address}</p>}
                </div>

                {/* Hidden Fields for Lat/Lng */}
                <input type="hidden" value={jobSiteLocation.lat}/>
                <input type="hidden" value={jobSiteLocation.lng}/>
            </div>


            {/* Nearest Hospital Section */}
            <h3>Nearest Emergency Hospital</h3>
            {nearestHospital ? (
                <div>
                    <p>
                        <strong>{nearestHospital.name}</strong>
                    </p>

                </div>
            ) : (
                <p>To be determined</p>
            )}

            {/* New Field: Car Key Location */}
            <h3>Car Key and First Aid Location</h3>
            <div className="form-group">
                <input
                    type="text"
                    placeholder="Enter car key location"
                    value={carKeyLocation}
                    onChange={(e) => setCarKeyLocation(e.target.value)}
                />
            </div>


            <h3>Team Leader</h3>
            <div className="radio-group">
                {users.length > 0 ? (
                    // Sort users alphabetically by name before mapping
                    [...users].sort((a, b) => a.name.localeCompare(b.name)).map((user) => (
                        <label key={user.id}>
                            <input
                                type="radio"
                                name="teamLeader"
                                value={user.id}
                                checked={teamLeader === String(user.id)}
                                onChange={(e) => setTeamLeader(e.target.value)}
                            />
                            {user.name}
                        </label>
                    ))
                ) : (
                    <p>Loading arborists...</p>
                )}
                {errors.teamLeader && <p style={{ color: 'red' }}>{errors.teamLeader}</p>}
            </div>

            {/* On-Site Arborists Section */}
            <h3>Crew</h3>
            <div className="checkbox-group">
                {users.length > 0 ? (
                    [...users]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((user) => (
                            <label key={user.id}>
                                <input
                                    type="checkbox"
                                    value={user.id}
                                    checked={onSiteArborists.includes(user.id)}
                                    onChange={() => toggleArborist(user.id)}
                                    disabled={user.id === currentUser?.id} // Disable checkbox for the current user
                                />
                                {user.name}
                            </label>
                        ))
                ) : (
                    <p>Loading arborists...</p>
                )}
                {errors.arborists && <p style={{ color: 'red' }}>{errors.arborists}</p>}
            </div>

            {/* Weather Conditions */}
            <h3>Weather Conditions</h3>
            <div className="checkbox-group">
                {weatherOptions.map((condition) => (
                    <label key={condition} style={{ marginRight: '10px' }}>
                        <input
                            type="checkbox"
                            value={condition}
                            checked={weatherConditions.includes(condition)}
                            onChange={(e) => {
                                const isChecked = e.target.checked;
                                const value = e.target.value;

                                if (isChecked) {
                                    handleWeatherChange(value);
                                } else {
                                    setWeatherConditions((prev) => prev.filter((c) => c !== value));
                                    setWeatherApproval(false); // Reset the approval checkbox
                                }
                            }}
                        />
                        {condition}
                    </label>
                ))}
            </div>

            {/* Confirmation Checkbox */}
            {!weatherConditions.includes('Good') && (
                <div style={{ marginTop: '10px' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={weatherApproval}
                            onChange={(e) => setWeatherApproval(e.target.checked)}
                        />
                        Can the work proceed safely despite the weather conditions?
                    </label>
                    {errors.weatherApproval && (
                        <p style={{ color: 'red', fontSize: '14px' }}>{errors.weatherApproval}</p>
                    )}
                </div>
            )}


            {/* Methods of Work */}
            <h3>Methods of Work</h3>
            <div className="checkbox-group">
                {methodsOfWorkOptions.map((method) => (
                    <div key={method}>
                        <label>
                            <input
                                type="checkbox"
                                value={method}
                                checked={methodsOfWork.includes(method)}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setMethodsOfWork((prev) =>
                                        prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
                                    );
                                }}
                            />
                            {method}</label>
                    </div>
                ))}
            </div>

            {/* On-Site Machinery */}
            <h3>On-Site Machinery</h3>
            <div className="checkbox-group">
                {machineryOptions.map((machine) => (
                    <div key={machine}>
                        <label>
                            <input
                                type="checkbox"
                                value={machine}
                                checked={onSiteMachinery.includes(machine)}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setOnSiteMachinery((prev) =>
                                        prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
                                    );
                                }}
                            />
                            {machine}</label>
                    </div>
                ))}
            </div>


            {/* Location Risks */}
            <h3>Location Considerations</h3>
            <div className="checkbox-group">
                {locationRiskOptions.map((risk) => (
                    <div key={risk}>
                        <label>
                            <input
                                type="checkbox"
                                value={risk}
                                checked={locationRisks.includes(risk)}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setLocationRisks((prev) =>
                                        prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
                                    );
                                }}
                            />
                            {risk}</label>
                    </div>
                ))}
            </div>


            {/* Tree Risks Section */}
            <h3>Tree Risks</h3>
            <div className="checkbox-group">
                {treeRiskOptions.map((risk) => (
                    <div key={risk}>
                        <label>
                            <input
                                type="checkbox"
                                value={risk}
                                checked={treeRisks.includes(risk)}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setTreeRisks((prev) =>
                                        prev.includes(value)
                                            ? prev.filter((r) => r !== value)
                                            : [...prev, value]
                                    );
                                    // If "No remarks" is selected, clear all others and reset confirmation
                                    if (value === 'No remarks' && e.target.checked) {
                                        setTreeRisks(['No remarks']);
                                        setTreeRisksApproved(false);
                                    } else if (value !== 'No remarks' && e.target.checked) {
                                        // Remove "No remarks" if any other risk is selected
                                        setTreeRisks((prev) => prev.filter((r) => r !== 'No remarks'));
                                    }
                                }}
                            />
                            {risk}
                        </label>
                    </div>
                ))}
            </div>
            {/* Confirmation checkbox appears if any tree risk other than "No remarks" is selected */}
            {treeRisks.some((risk) => risk !== 'No remarks') && (
                <div style={{ marginTop: '10px' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={treeRisksApproved}
                            onChange={(e) => setTreeRisksApproved(e.target.checked)}
                        />
                        Can the work proceed safely despite the tree risks?
                    </label>
                    {errors.treeRisks && <p style={{ color: 'red' }}>{errors.treeRisks}</p>}
                </div>
            )}


            {/* New Field: Additional Risks */}
            <h3>Additional Risks</h3>
            <div className="form-group">
        <textarea
            placeholder="Enter additional risks if they present (optional)"
            value={additionalRisks}
            onChange={(e) => setAdditionalRisks(e.target.value)}
        />
            </div>

            {/* New Field: Safety Approval */}
            <h3>Safety Confirmation</h3>
            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={safetyApproval}
                        onChange={(e) => setSafetyApproval(e.target.checked)}
                    />
                    Everyone is aware of the plan, has appropriate PPE and work can be carried out safely.
                </label>
                { !safetyApproval && <p style={{ color: 'red' }}>Safety confirmation is required.</p> }
            </div>
            {/* Submit Button */}
            <button type="submit">Submit</button>
        </form>
    );
};

export default RiskAssessmentForm;
