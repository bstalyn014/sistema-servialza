import React from 'react';
import { PERSONAL } from '../utils/constants';
import { toTitleCase } from '../utils/formatters';
import { FormGroup, Select } from './FormComponents';

const PersonalSelect = ({ supervisor, obrero, onSupervisorChange, onObreroChange }) => {
    
    const personalOptions = PERSONAL.map(p => toTitleCase(p)).sort();

    return (
        <>
            <FormGroup label="Supervisor" required>
                <Select 
                    name="supervisor"
                    options={personalOptions} 
                    placeholder="Seleccione un supervisor"
                    value={supervisor}
                    onChange={onSupervisorChange}
                    required
                />
            </FormGroup>

            <FormGroup label="Obrero" required>
                <Select 
                    name="obrero"
                    options={personalOptions} 
                    placeholder="Seleccione un obrero"
                    value={obrero}
                    onChange={onObreroChange}
                    required
                />
            </FormGroup>

            {supervisor && obrero && (
                <div className="cuadrilla-display active">
                    Cuadrilla: {supervisor} / {obrero}
                </div>
            )}
        </>
    );
};

export default PersonalSelect;
