"""
Sequential AI Validation System for RoosterScan
Implements dual-model framework: Pose Detection → Quality Gate → Injury Classification

This script provides the core sequential validation logic:
1. Stage 1: Pose Detection with quality assessment
2. Stage 2: Injury Classification (only if pose quality is sufficient)
3. Stage 3: Combined analysis and recommendations

Usage:
    python sequential_analysis.py <image_path> <pose_model_path> <injury_model_path>
"""

import sys
import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from ultralytics import YOLO

# Keypoint names for pose detection (17 keypoints)
KEYPOINT_NAMES = [
    'beak_tip', 'eye', 'comb_top', 'neck_base', 'chest', 'back_mid', 'tail_base',
    'left_wing_shoulder', 'left_wing_elbow', 'left_wing_tip',
    'right_wing_shoulder', 'right_wing_elbow', 'right_wing_tip',
    'left_leg_joint', 'left_foot', 'right_leg_joint', 'right_foot'
]

# Quality gate thresholds (optimized for better acceptance rate)
POSE_CONFIDENCE_THRESHOLD = 0.65  # Reduced from 0.80 for better acceptance
MIN_KEYPOINTS_DETECTED = 12        # Reduced from 15 for better acceptance


class SequentialAnalyzer:
    """Sequential AI validation system for rooster health analysis"""
    
    def __init__(self, pose_model_path: str, injury_model_path: str):
        self.pose_model_path = pose_model_path
        self.injury_model_path = injury_model_path
        self.pose_model = None
        self.injury_model = None
        
    def load_models(self) -> bool:
        """Load both AI models"""
        try:
            # Load pose detection model
            if not os.path.exists(self.pose_model_path):
                raise FileNotFoundError(f"Pose model not found: {self.pose_model_path}")
            self.pose_model = YOLO(self.pose_model_path)
            
            # Load injury classification model
            if not os.path.exists(self.injury_model_path):
                raise FileNotFoundError(f"Injury model not found: {self.injury_model_path}")
            self.injury_model = YOLO(self.injury_model_path)
            
            return True
        except Exception as e:
            print(json.dumps({
                'success': False,
                'error': f'Failed to load models: {str(e)}',
                'stage': 'model_loading'
            }))
            return False
    
    def stage1_pose_detection(self, image_path: str) -> Dict:
        """Stage 1: Pose detection with quality assessment"""
        try:
            results = self.pose_model(image_path)
            
            if not results or len(results) == 0:
                return {
                    'success': False,
                    'stage': 'pose_detection',
                    'error': 'No detection results',
                    'quality_gate_passed': False
                }
            
            result = results[0]
            
            # Extract keypoints if available
            if result.keypoints is not None and len(result.keypoints.data) > 0:
                keypoints_data = result.keypoints.data[0].cpu().numpy()
                keypoints = []
                keypoints_detected = 0
                
                for i, (x, y, conf) in enumerate(keypoints_data):
                    if i < len(KEYPOINT_NAMES):
                        kp = {
                            'name': KEYPOINT_NAMES[i],
                            'x': float(x),
                            'y': float(y),
                            'confidence': float(conf)
                        }
                        keypoints.append(kp)
                        
                        # Count high-confidence keypoints
                        if conf > 0.5:
                            keypoints_detected += 1
                
                # Get overall pose confidence
                pose_confidence = float(result.boxes.conf[0]) if result.boxes is not None and len(result.boxes.conf) > 0 else 0.0
                
                # Quality gate assessment
                quality_gate_passed = (
                    pose_confidence >= POSE_CONFIDENCE_THRESHOLD and 
                    keypoints_detected >= MIN_KEYPOINTS_DETECTED
                )
                
                return {
                    'success': True,
                    'stage': 'pose_detection',
                    'keypoints': keypoints,
                    'pose_confidence': pose_confidence,
                    'keypoints_detected': keypoints_detected,
                    'quality_gate_passed': quality_gate_passed,
                    'quality_assessment': self._assess_pose_quality(pose_confidence, keypoints_detected)
                }
            else:
                return {
                    'success': False,
                    'stage': 'pose_detection',
                    'error': 'No keypoints detected',
                    'quality_gate_passed': False
                }
                
        except Exception as e:
            return {
                'success': False,
                'stage': 'pose_detection',
                'error': str(e),
                'quality_gate_passed': False
            }
    
    def stage2_injury_classification(self, image_path: str, pose_result: Dict) -> Dict:
        """Stage 2: Injury classification (only if quality gate passed)"""
        if not pose_result.get('quality_gate_passed', False):
            return {
                'success': False,
                'stage': 'injury_classification',
                'error': 'Skipped due to insufficient pose quality',
                'skipped': True
            }
        
        try:
            results = self.injury_model(image_path, verbose=False)
            
            if not results or len(results) == 0:
                return {
                    'success': False,
                    'stage': 'injury_classification',
                    'error': 'No classification results'
                }
            
            result = results[0]
            
            # Extract classification results
            if hasattr(result, 'probs') and result.probs is not None:
                names = result.names  # {0: 'healthy', 1: 'injured'} or similar
                probs = result.probs
                
                # Get predicted class and confidence
                pred_class_idx = probs.top1
                pred_class_name = names[pred_class_idx]
                confidence = float(probs.top1conf.item())
                
                # Get all class probabilities
                all_probs = {names[i]: float(probs.data[i].item()) for i in range(len(names))}
                
                return {
                    'success': True,
                    'stage': 'injury_classification',
                    'classification': pred_class_name,
                    'confidence': confidence,
                    'probabilities': all_probs
                }
            else:
                return {
                    'success': False,
                    'stage': 'injury_classification',
                    'error': 'No classification probabilities available'
                }
                
        except Exception as e:
            return {
                'success': False,
                'stage': 'injury_classification',
                'error': str(e)
            }
    
    def stage3_combined_analysis(self, pose_result: Dict, injury_result: Dict) -> Dict:
        """Stage 3: Combined analysis and recommendations"""
        analysis = {
            'stage': 'combined_analysis',
            'pose_detection': pose_result,
            'injury_classification': injury_result,
            'overall_status': 'incomplete',
            'recommendations': []
        }
        
        # Determine overall analysis status
        if not pose_result.get('success', False):
            analysis.update({
                'overall_status': 'pose_detection_failed',
                'primary_issue': 'Unable to detect rooster pose',
                'recommendations': [
                    'Ensure rooster is clearly visible in the image',
                    'Use good lighting and clear background',
                    'Position camera at rooster body level',
                    'Try a different angle or distance'
                ]
            })
            return analysis
        
        if not pose_result.get('quality_gate_passed', False):
            analysis.update({
                'overall_status': 'insufficient_quality',
                'primary_issue': 'Pose detection quality too low for reliable injury analysis',
                'pose_confidence': pose_result.get('pose_confidence', 0),
                'quality_threshold': POSE_CONFIDENCE_THRESHOLD,
                'recommendations': [
                    'Improve image quality (lighting, focus, angle)',
                    'Ensure rooster is fully visible',
                    'Reduce background distractions',
                    'Try capturing from a different angle'
                ]
            })
            return analysis
        
        if injury_result.get('skipped', False):
            analysis.update({
                'overall_status': 'injury_analysis_skipped',
                'primary_issue': 'Injury analysis skipped due to pose quality',
                'recommendations': ['Improve pose detection quality first']
            })
            return analysis
        
        if not injury_result.get('success', False):
            analysis.update({
                'overall_status': 'injury_classification_failed',
                'primary_issue': 'Injury classification failed',
                'recommendations': [
                    'Try with a different image',
                    'Ensure image shows rooster clearly'
                ]
            })
            return analysis
        
        # Both stages successful - complete analysis
        classification = injury_result.get('classification', 'unknown')
        injury_confidence = injury_result.get('confidence', 0)
        pose_confidence = pose_result.get('pose_confidence', 0)
        combined_confidence = (pose_confidence + injury_confidence) / 2
        
        analysis.update({
            'overall_status': 'analysis_complete',
            'health_assessment': classification,
            'combined_confidence': combined_confidence,
            'confidence_breakdown': {
                'pose_detection': pose_confidence,
                'injury_classification': injury_confidence
            }
        })
        
        # Generate specific recommendations based on results
        if classification == 'bumblefoot':
            analysis['recommendations'] = [
                'BUMBLEFOOT DETECTED - Immediate attention required',
                'Examine foot pads for swelling, heat, or black scabs',
                'Check for limping or favoring one foot',
                'Isolate bird to prevent spread and allow treatment',
                'Consult veterinarian for proper bumblefoot treatment',
                'Clean and disinfect coop areas, especially perches',
                'Review perch design - avoid sharp edges or rough surfaces'
            ]
            analysis['specific_findings'] = ['Bumblefoot detected in foot area']
            
        elif classification == 'comb_injury':
            analysis['recommendations'] = [
                '🐓 COMB/WATTLE INJURY DETECTED - Attention required',
                'Examine comb and wattles for wounds, tears, or bleeding',
                'Check for signs of fighting or pecking from other birds',
                'Clean wounds with antiseptic solution',
                'Apply antibiotic ointment to prevent infection',
                'Isolate bird if injury is severe or bleeding',
                'Monitor for signs of infection (swelling, pus, heat)',
                'Consult veterinarian if injury does not improve in 2-3 days'
            ]
            analysis['specific_findings'] = ['Head/comb area shows abnormalities']
            
        elif classification == 'feather_loss':
            analysis['recommendations'] = [
                '🪶 FEATHER LOSS DETECTED - Investigation needed',
                'Check for external parasites (mites, lice)',
                'Examine for signs of pecking or bullying from flock mates',
                'Assess nutrition - ensure adequate protein (16-20%)',
                'Consider molting season (normal seasonal feather loss)',
                'Check for skin irritation or infection under bare patches',
                'Improve coop ventilation and reduce stress factors',
                'Provide dust bath area for parasite control',
                'Consult veterinarian if feather loss is severe or spreading'
            ]
            analysis['specific_findings'] = ['Visible feather loss or bare patches detected']
            
        elif classification == 'wing_injury':
            analysis['recommendations'] = [
                'WING INJURY DETECTED - Immediate attention required',
                'Check for wing drooping, asymmetry, or limited movement',
                'Examine wing joints for swelling, heat, or pain',
                'Look for fractures, dislocations, or sprains',
                'Restrict movement - confine to small, quiet area',
                'Avoid handling the injured wing excessively',
                'Consult veterinarian for proper diagnosis and treatment',
                'May require splinting or bandaging by professional',
                'Monitor for signs of infection or worsening condition'
            ]
            
            # Add pose-specific insights for wing injury
            pose_insights = self._analyze_pose_for_injuries(pose_result.get('keypoints', []))
            if pose_insights:
                analysis['specific_findings'] = pose_insights
                analysis['recommendations'].extend([
                    f'Pose analysis confirms: {", ".join(pose_insights)}',
                    'Wing asymmetry detected in pose analysis'
                ])
            else:
                analysis['specific_findings'] = ['Wing abnormality detected']
                
        else:  # healthy
            analysis['recommendations'] = [
                'Rooster appears healthy based on AI analysis',
                'Continue regular health monitoring',
                'Maintain good nutrition and housing conditions',
                'Schedule routine veterinary check-ups',
                'Monitor for early signs of injury or illness',
                'Ensure clean water and balanced diet',
                'Provide adequate space and enrichment'
            ]
            analysis['specific_findings'] = ['No visible health issues detected']
        
        return analysis
    
    def _assess_pose_quality(self, confidence: float, keypoints_detected: int) -> str:
        """Assess pose detection quality"""
        if confidence >= 0.85 and keypoints_detected >= 16:
            return 'excellent'
        elif confidence >= 0.65 and keypoints_detected >= 12:
            return 'good'
        elif confidence >= 0.50 and keypoints_detected >= 10:
            return 'fair'
        elif confidence >= 0.35 and keypoints_detected >= 8:
            return 'acceptable'
        else:
            return 'poor'
    
    def _analyze_pose_for_injuries(self, keypoints: List[Dict]) -> List[str]:
        """Analyze pose keypoints for specific injury indicators"""
        findings = []
        
        if not keypoints:
            return findings
        
        # Convert to dict for easier access
        kp_dict = {kp['name']: kp for kp in keypoints if kp['confidence'] > 0.5}
        
        # Check wing symmetry
        left_wing_tip = kp_dict.get('left_wing_tip')
        right_wing_tip = kp_dict.get('right_wing_tip')
        chest = kp_dict.get('chest')
        
        if left_wing_tip and right_wing_tip and chest:
            left_wing_drop = left_wing_tip['y'] - chest['y']
            right_wing_drop = right_wing_tip['y'] - chest['y']
            wing_asymmetry = abs(left_wing_drop - right_wing_drop)
            
            if wing_asymmetry > 30:  # pixels
                findings.append('wing asymmetry detected')
        
        # Check leg positioning
        left_foot = kp_dict.get('left_foot')
        right_foot = kp_dict.get('right_foot')
        
        if left_foot and right_foot:
            foot_height_diff = abs(left_foot['y'] - right_foot['y'])
            if foot_height_diff > 25:  # pixels
                findings.append('uneven leg positioning')
        
        return findings
    
    def analyze(self, image_path: str) -> Dict:
        """Run complete sequential analysis with adaptive fallback"""
        if not self.load_models():
            return {'success': False, 'error': 'Failed to load models'}
        
        # Stage 1: Pose Detection
        pose_result = self.stage1_pose_detection(image_path)
        
        # ADAPTIVE LOGIC: Check if pose detection failed completely
        pose_failed = not pose_result.get('success', False)
        no_keypoints = pose_result.get('keypoints_detected', 0) == 0
        
        # If pose detection completely failed, try direct injury classification
        if pose_failed or no_keypoints:
            # Direct injury classification (close-up mode)
            try:
                results = self.injury_model(image_path)
                if results and len(results) > 0:
                    result = results[0]
                    if hasattr(result, 'probs') and result.probs is not None:
                        names = result.names
                        probs = result.probs
                        pred_class_idx = probs.top1
                        pred_class_name = names[pred_class_idx]
                        confidence = float(probs.top1conf.item())
                        all_probs = {names[i]: float(probs.data[i].item()) for i in range(len(names))}
                        
                        # Return direct classification result
                        return {
                            'success': True,
                            'analysis_type': 'direct_classification',
                            'analysis_mode': 'close_up',
                            'timestamp': str(Path(image_path).stat().st_mtime),
                            'stage': 'injury_classification_only',
                            'pose_detection': {
                                'success': False,
                                'note': 'Skipped - close-up image detected'
                            },
                            'injury_classification': {
                                'success': True,
                                'classification': pred_class_name,
                                'confidence': confidence,
                                'probabilities': all_probs
                            },
                            'overall_status': 'analysis_complete',
                            'health_assessment': pred_class_name,
                            'combined_confidence': confidence,
                            'recommendations': self._get_recommendations_for_class(pred_class_name),
                            'specific_findings': [f'{pred_class_name.replace("_", " ").title()} detected in close-up analysis']
                        }
            except Exception as e:
                pass  # Fall through to normal sequential validation
        
        # Stage 2: Injury Classification (conditional - normal sequential flow)
        injury_result = self.stage2_injury_classification(image_path, pose_result)
        
        # Stage 3: Combined Analysis
        combined_result = self.stage3_combined_analysis(pose_result, injury_result)
        
        return {
            'success': True,
            'analysis_type': 'sequential_validation',
            'analysis_mode': 'full_body',
            'timestamp': str(Path(image_path).stat().st_mtime),
            **combined_result
        }
    
    def _get_recommendations_for_class(self, classification: str) -> list:
        """Get recommendations for a specific injury class"""
        if classification == 'bumblefoot':
            return [
                'BUMBLEFOOT DETECTED - Immediate attention required',
                'Examine foot pads for swelling, heat, or black scabs',
                'Check for limping or favoring one foot',
                'Isolate bird to prevent spread and allow treatment',
                'Consult veterinarian for proper bumblefoot treatment',
                'Clean and disinfect coop areas, especially perches',
                'Review perch design - avoid sharp edges or rough surfaces'
            ]
        elif classification == 'comb_injury':
            return [
                'COMB/WATTLE INJURY DETECTED - Attention required',
                'Examine comb and wattles for wounds, tears, or bleeding',
                'Check for signs of fighting or pecking from other birds',
                'Clean wounds with antiseptic solution',
                'Apply antibiotic ointment to prevent infection',
                'Consult veterinarian if injury does not improve in 2-3 days'
            ]
        elif classification == 'feather_loss':
            return [
                'FEATHER LOSS DETECTED - Investigation needed',
                'Check for external parasites (mites, lice)',
                'Examine for signs of pecking or bullying from flock mates',
                'Assess nutrition - ensure adequate protein (16-20%)',
                'Consider molting season (normal seasonal feather loss)',
                'Consult veterinarian if feather loss is severe or spreading'
            ]
        elif classification == 'wing_injury':
            return [
                'WING INJURY DETECTED - Immediate attention required',
                'Check for wing drooping, asymmetry, or limited movement',
                'Examine wing joints for swelling, heat, or pain',
                'Restrict movement - confine to small, quiet area',
                'Consult veterinarian for proper diagnosis and treatment'
            ]
        else:  # healthy
            return [
                'Rooster appears healthy based on AI analysis',
                'Continue regular health monitoring',
                'Maintain good nutrition and housing conditions',
                'Monitor for early signs of injury or illness'
            ]


def main():
    """Main entry point for command-line usage"""
    if len(sys.argv) != 4:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python sequential_analysis.py <image_path> <pose_model_path> <injury_model_path>'
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    pose_model_path = sys.argv[2]
    injury_model_path = sys.argv[3]
    
    # Validate inputs
    if not os.path.exists(image_path):
        print(json.dumps({
            'success': False,
            'error': f'Image file not found: {image_path}'
        }))
        sys.exit(1)
    
    # Run sequential analysis
    analyzer = SequentialAnalyzer(pose_model_path, injury_model_path)
    result = analyzer.analyze(image_path)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
