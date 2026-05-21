import { useAudioEngine as useAudnessEngine } from '@audness/core'

export function useAudioEngine() {
  return useAudnessEngine({ appName: 'Puddle', workletUrl: '/bitcrush-processor.js' })
}
