import React from 'react';

export const FormGroup = ({ label, required, children, className = "" }) => (
    <div className={`form-group ${className}`}>
        {label && <label className={required ? "required" : ""}>{label}</label>}
        {children}
    </div>
);

export const Input = ({ type = "text", ...props }) => (
    <input type={type} {...props} />
);

export const Select = ({ options, placeholder, value, onChange, ...props }) => (
    <select value={value} onChange={onChange} {...props}>
        <option value="">{placeholder || "Seleccione una opción"}</option>
        {options.map((opt, idx) => (
            <option key={idx} value={opt}>
                {opt}
            </option>
        ))}
    </select>
);

export const RadioGroup = ({ name, options, value, onChange }) => (
    <div className="radio-group">
        {options.map((opt) => (
            <label key={opt}>
                <input 
                    type="radio" 
                    name={name} 
                    value={opt} 
                    checked={value === opt} 
                    onChange={onChange}
                /> 
                {opt}
            </label>
        ))}
    </div>
);

export const ConditionalField = ({ show, children }) => {
    if (!show) return null;
    return (
        <div className="conditional-field active">
            {children}
        </div>
    );
};

export const CopyButton = ({ text, label = "Copiar Resumen", className = "", ...props }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
             setCopied(true);
             setTimeout(() => setCopied(false), 2000);
        }).catch(err => console.error('Failed to copy', err));
    };

    return (
        <button 
            className={`btn-copiar ${copied ? 'copiado' : ''} ${className}`} 
            onClick={handleCopy}
            type="button"
            {...props}
        >
            {copied ? '✅ Copiado' : `📋 ${label}`}
        </button>
    );
};
