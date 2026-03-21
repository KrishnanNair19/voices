/**
 * Story creation wizard — Phase 3.3.
 *
 * 4 steps:
 *   0. Format   — Text or Voice
 *   1. Content  — Editor/recorder + image/video attachments
 *   2. Details  — Title, description, tags, visibility
 *   3. Location — Optional geolocation + name, then Publish
 *
 * Content rules:
 *   - Primary: text OR voice (required)
 *   - Attachments: up to 3 images + 1 video (optional, both primary types)
 */

import Box from '@mui/material/Box'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import { tokens } from '@voices/core'
import { useCreateStoryController, WIZARD_STEPS } from '../hooks/useCreateStoryController'
import StepFormat from '../components/StepFormat'
import StepContent from '../components/StepContent'
import StepDetails from '../components/StepDetails'
import StepLocation from '../components/StepLocation'

export default function CreateStoryPage() {
  const ctrl = useCreateStoryController()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 2,
        py: 6,
        background: `radial-gradient(ellipse at 50% 0%, ${tokens.color.primary}0e 0%, transparent 55%)`,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 520 }}>
        {/* Stepper */}
        <Stepper
          activeStep={ctrl.step}
          sx={{
            mb: 5,
            '& .MuiStepLabel-label': { fontSize: '0.75rem' },
            '& .MuiStepIcon-root.Mui-active': { color: tokens.color.primary },
            '& .MuiStepIcon-root.Mui-completed': { color: tokens.color.primary },
          }}
        >
          {WIZARD_STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step panels */}
        {ctrl.step === 0 && (
          <StepFormat
            value={ctrl.primaryType}
            onChange={ctrl.setPrimaryType}
            onNext={ctrl.nextStep}
          />
        )}

        {ctrl.step === 1 && (
          <StepContent
            primaryType={ctrl.primaryType}
            textContent={ctrl.textContent}
            onTextChange={ctrl.setTextContent}
            onRecorded={(blob, durationMs) => {
              ctrl.setAudioBlob(blob)
              ctrl.setAudioDurationMs(durationMs)
            }}
            onResetRecording={() => {
              ctrl.setAudioBlob(null)
              ctrl.setAudioDurationMs(0)
            }}
            hasRecording={ctrl.audioBlob !== null}
            images={ctrl.mediaFiles}
            video={ctrl.videoFile}
            maxImages={ctrl.maxImages}
            onAddImages={ctrl.addImages}
            onRemoveImage={ctrl.removeImage}
            onSetVideo={ctrl.setVideo}
            canProceed={ctrl.step1Valid}
            onBack={ctrl.prevStep}
            onNext={ctrl.nextStep}
          />
        )}

        {ctrl.step === 2 && (
          <StepDetails
            title={ctrl.title}
            titleError={ctrl.titleError}
            onTitleChange={ctrl.setTitle}
            description={ctrl.description}
            onDescriptionChange={ctrl.setDescription}
            tags={ctrl.tags}
            onAddTag={ctrl.addTag}
            onRemoveTag={ctrl.removeTag}
            isPublic={ctrl.isPublic}
            onIsPublicChange={ctrl.setIsPublic}
            onBack={ctrl.prevStep}
            onNext={ctrl.nextStep}
            onValidate={ctrl.validateDetails}
          />
        )}

        {ctrl.step === 3 && (
          <StepLocation
            location={ctrl.location}
            locationName={ctrl.locationName}
            onLocationNameChange={ctrl.setLocationName}
            onDetectLocation={ctrl.detectLocation}
            isGeolocating={ctrl.isGeolocating}
            geoError={ctrl.geoError}
            onBack={ctrl.prevStep}
            onPublish={ctrl.publish}
            isPublishing={ctrl.isPublishing}
            publishError={ctrl.publishError}
            uploadProgress={ctrl.uploadProgress}
          />
        )}
      </Box>
    </Box>
  )
}
