import { memo, useCallback } from 'react'
import { RotaryKnob } from './RotaryKnob'
import './VCFControl.css'

/**
 * VCF — voltage-controlled filter.
 * All 3 oscillators routed through by default. Just Cut + Res knobs.
 */
export const VCFControl = memo(function VCFControl({
  vcfCutoff,
  vcfResonance,
  getEngine,
  onCutoffChange,
  onResonanceChange,
}) {
  const handleCutoff = useCallback((val) => {
    onCutoffChange(val)
    getEngine().setVcfCutoff(val)
  }, [getEngine, onCutoffChange])

  const handleResonance = useCallback((val) => {
    onResonanceChange(val)
    getEngine().setVcfResonance(val)
  }, [getEngine, onResonanceChange])

  return (
    <div className="vcf-control vcf-control--active">
      <label className="vcf-control__label">VCF</label>
      <div className="vcf-control__knobs">
        <RotaryKnob
          value={vcfCutoff}
          min={20}
          max={20000}
          step={1}
          onChange={handleCutoff}
          color="#e040fb"
          label="Cut"
          size={38}
        />
        <RotaryKnob
          value={vcfResonance}
          min={0}
          max={25}
          step={0.1}
          onChange={handleResonance}
          color="#e040fb"
          label="Res"
          size={38}
        />
      </div>
    </div>
  )
})
