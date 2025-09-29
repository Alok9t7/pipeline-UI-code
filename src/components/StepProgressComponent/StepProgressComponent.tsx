import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import * as React from 'react';

import home from '../../assets/home.svg';
import UploadDatasetComponent from '../UploadDataSetComponent/UploadDatasetComponent';
import './StepProgressComponent.scss';

const steps = ['Capture', 'Annotate', 'Training', 'Compile', 'Deploy'];

export interface SteppProgressPageProps {
  setLoggedInUser: (v: string | null) => void;
}

export default function SteppProgressComponent({ setLoggedInUser }: SteppProgressPageProps) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set<number>());

  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <>
      <div className="flex-container">
        <div className="left-section">
          <img src={home} alt="home" className="breadcrumb-icon" />
          <span className="breadcrumb-separator">/</span>
          <h3 className="project-name">Project Name</h3>
        </div>

        {/* Center - Stepper */}
        <div className="stepper-center">
          <Box className="custom-stepper" sx={{ width: '100%' }}>
            <Stepper activeStep={activeStep}>
              {steps.map((label, index) => {
                const stepProps: { completed?: boolean } = {};
                const labelProps: { optional?: React.ReactNode } = {};

                if (isStepSkipped(index)) {
                  stepProps.completed = false;
                }

                return (
                  <Step key={label} {...stepProps}>
                    <StepLabel {...labelProps}>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>
        </div>

        {/* Right - Empty placeholder */}
        <div style={{ flex: 1 }}></div>
      </div>
      <div className="center-upload">
        <UploadDatasetComponent setLoggedInUser={setLoggedInUser} />
      </div>
    </>
  );
}
