import {
    getValueAsType,
    isCSSVariableName,
    numberValueTypes,
    transformProps,
} from "motion-dom"
import { MotionProps } from "../../../motion/types"
import { ResolvedValues } from "../../types"
import { HTMLRenderState } from "../types"
import { buildTransform } from "./build-transform"

export function buildHTMLStyles(
    state: HTMLRenderState,
    latestValues: ResolvedValues,
    transformTemplate?: MotionProps["transformTemplate"]
) {
    const { style, vars, transformOrigin } = state

    // Track whether we encounter any transform or transformOrigin values.
    let hasTransform = false
    let hasTransformOrigin = false

    /**
     * Loop over all our latest animated values and decide whether to handle them
     * as a style or CSS variable.
     *
     * Transforms and transform origins are kept separately for further processing.
     */
    for (const key in latestValues) {
        const value = latestValues[key]

        if (transformProps.has(key)) {
            // If this is a transform, flag to enable further transform processing
            hasTransform = true
            continue
        } else if (isCSSVariableName(key)) {
            vars[key] = value
            continue
        } else {
            // Convert the value to its default value type, ie 0 -> "0px"
            const valueAsType = getValueAsType(value, numberValueTypes[key])

            if (key.startsWith("origin")) {
                // If this is a transform origin, flag and enable further transform-origin processing
                hasTransformOrigin = true
                transformOrigin[key as keyof typeof transformOrigin] =
                    valueAsType
            } else {
                style[key] = valueAsType
            }
        }
    }

    if (!latestValues.transform) {
        if (hasTransform || transformTemplate) {
            style.transform = buildTransform(
                latestValues,
                state.transform,
                transformTemplate
            )
        } else if (style.transform) {
            /**
             * If we have previously created a transform but currently don't have any,
             * reset transform style to none.
             */
            style.transform = "none"
        }
    }

    /**
     * Build a transformOrigin style. Uses the same defaults as the browser for
     * undefined origins.
     */
    if (hasTransformOrigin) {
        const {
            originX = "50%",
            originY = "50%",
            originZ = 0,
        } = transformOrigin
        style.transformOrigin = `${originX} ${originY} ${originZ}`
    }
}
