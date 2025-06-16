import React from 'react';
import './css/StepProgressBar.css';

const StepProgressBar = ({ currentStep }) => {
  const steps = ['Personal Details', 'Company Information', 'Message'];

  return (
    <div className="step-progress">
      {steps.map((label, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={step} className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
            <div className="step-circle">
              {isCompleted ? <span className="checkmark">✓</span> : step}
            </div>
            <div className="step-label">{label}</div>
            {step !== steps.length && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
};

export default StepProgressBar;
