// client/src/components/NutritionPlanner.tsx
// Evidence-based nutrition planning for chronic disease management and ED prevention

import React, { useState, useMemo } from "react";

interface Props {
  onCreate: (instruction: string) => Promise<void>;
}

// Condition-specific dietary guidelines based on clinical evidence
const DIETARY_PROTOCOLS = {
  "Heart Healthy": {
    icon: "❤️",
    conditions: ["Heart failure", "Coronary artery disease", "Hypertension"],
    restrictions: {
      sodium: "< 2000mg/day",
      saturatedFat: "< 7% of calories",
      cholesterol: "< 200mg/day"
    },
    recommendations: [
      "Choose lean proteins (fish, poultry, legumes)",
      "Increase fruits and vegetables (5-9 servings/day)",
      "Select whole grains over refined",
      "Use healthy fats (olive oil, avocados, nuts)",
      "Limit processed and packaged foods",
      "Read nutrition labels for sodium content"
    ],
    mealPlan: {
      breakfast: "Oatmeal with berries, low-fat yogurt",
      lunch: "Grilled chicken salad with olive oil dressing",
      dinner: "Baked salmon, steamed vegetables, brown rice",
      snacks: "Fresh fruit, unsalted nuts, vegetables with hummus"
    },
    warningFoods: ["Canned soups", "Deli meats", "Frozen dinners", "Restaurant meals", "Salty snacks"]
  },
  "Diabetic": {
    icon: "🩺",
    conditions: ["Type 2 Diabetes", "Pre-diabetes", "Gestational diabetes"],
    restrictions: {
      carbohydrates: "Count carbs - 45-60g per meal",
      sugar: "Limit added sugars",
      fiber: "> 25-30g/day"
    },
    recommendations: [
      "Consistent carbohydrate intake at each meal",
      "Pair carbs with protein or healthy fat",
      "Choose low glycemic index foods",
      "Eat regular meals and snacks",
      "Monitor blood sugar response to foods",
      "Stay hydrated with water"
    ],
    mealPlan: {
      breakfast: "Eggs with whole grain toast, 1/2 grapefruit",
      lunch: "Turkey and avocado wrap, side salad",
      dinner: "Grilled lean meat, non-starchy vegetables, quinoa",
      snacks: "Greek yogurt, nuts, cheese with crackers"
    },
    warningFoods: ["Sugary drinks", "White bread/rice", "Fruit juices", "Candy", "Pastries"]
  },
  "Renal": {
    icon: "🫘",
    conditions: ["Chronic kidney disease", "Kidney failure", "Dialysis"],
    restrictions: {
      protein: "Moderate based on stage",
      potassium: "May need restriction",
      phosphorus: "Limit if elevated"
    },
    recommendations: [
      "Work with renal dietitian for specific limits",
      "Monitor protein intake as directed",
      "Choose low-potassium fruits/vegetables if needed",
      "Limit phosphorus-rich foods",
      "Control fluid intake if prescribed",
      "Take phosphate binders with meals if prescribed"
    ],
    mealPlan: {
      breakfast: "Egg white omelet, white bread toast, apple",
      lunch: "Pasta salad with vegetables, dinner roll",
      dinner: "Portion-controlled meat, rice, green beans",
      snacks: "Rice cakes, applesauce, berries"
    },
    warningFoods: ["Beans", "Nuts", "Dairy products", "Whole grains", "Dark sodas"]
  },
  "COPD/Respiratory": {
    icon: "🫁",
    conditions: ["COPD", "Emphysema", "Chronic bronchitis"],
    restrictions: {
      calories: "May need increase",
      meals: "Small, frequent meals"
    },
    recommendations: [
      "Eat smaller, more frequent meals",
      "Choose nutrient-dense foods",
      "Limit foods that cause gas/bloating",
      "Stay hydrated but limit fluids at meals",
      "Rest before eating",
      "Use nutritional supplements if needed"
    ],
    mealPlan: {
      breakfast: "Protein smoothie with fruit",
      lunch: "Small sandwich with soup",
      dinner: "Small portion meat, mashed potatoes, cooked vegetables",
      snacks: "Nutritional drinks, pudding, cheese"
    },
    warningFoods: ["Carbonated drinks", "Fried foods", "Spicy foods", "Raw vegetables", "Beans"]
  }
};

const NutritionPlanner: React.FC<Props> = ({ onCreate }) => {
  const [selectedProtocol, setSelectedProtocol] = useState<string>("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [mealTracking, setMealTracking] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: false
  });
  const [waterIntake, setWaterIntake] = useState(0);
  const [symptoms, setSymptoms] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // Calculate daily compliance score
  const complianceScore = useMemo(() => {
    const mealCount = Object.values(mealTracking).filter(Boolean).length;
    const waterScore = Math.min(waterIntake / 8, 1); // 8 glasses target
    return Math.round(((mealCount / 4) * 0.7 + waterScore * 0.3) * 100);
  }, [mealTracking, waterIntake]);

  // Generate personalized nutrition plan
  const generateNutritionPlan = () => {
    if (!selectedProtocol) return "";

    const protocol = DIETARY_PROTOCOLS[selectedProtocol as keyof typeof DIETARY_PROTOCOLS];

    let plan = `${selectedProtocol} Diet Plan\n\n`;
    plan += `CONDITIONS MANAGED: ${protocol.conditions.join(", ")}\n\n`;

    plan += "DIETARY RESTRICTIONS:\n";
    Object.entries(protocol.restrictions).forEach(([key, value]) => {
      plan += `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
    });

    plan += "\nKEY RECOMMENDATIONS:\n";
    protocol.recommendations.forEach(rec => {
      plan += `• ${rec}\n`;
    });

    plan += "\nSAMPLE MEAL PLAN:\n";
    Object.entries(protocol.mealPlan).forEach(([meal, food]) => {
      plan += `• ${meal.charAt(0).toUpperCase() + meal.slice(1)}: ${food}\n`;
    });

    plan += "\nFOODS TO AVOID:\n";
    protocol.warningFoods.forEach(food => {
      plan += `• ${food}\n`;
    });

    if (customInstructions) {
      plan += `\nADDITIONAL INSTRUCTIONS:\n${customInstructions}\n`;
    }

    if (symptoms) {
      plan += `\nSYMPTOMS TO MONITOR:\n${symptoms}\n`;
    }

    return plan;
  };

  const handleCreateNutritionOrder = async () => {
    if (!selectedProtocol) {
      setMessage("Please select a dietary protocol");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const nutritionPlan = generateNutritionPlan();
      await onCreate(nutritionPlan);
      setMessage("Nutrition plan created successfully");

      // Reset form after success
      setTimeout(() => {
        setSelectedProtocol("");
        setCustomInstructions("");
        setSymptoms("");
        setMessage("");
      }, 3000);

    } catch (error: any) {
      setMessage(`Error: ${error?.message || "Failed to create nutrition plan"}`);
    } finally {
      setBusy(false);
    }
  };

  // Track water intake
  const addWater = () => {
    setWaterIntake(prev => Math.min(prev + 1, 12)); // Max 12 glasses
  };

  return (
    <div style={{
      border: "1px solid #FF9800",
      padding: 16,
      borderRadius: 8,
      margin: "12px 0",
      backgroundColor: "#fffaf5"
    }}>
      {/* Header with compliance score */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16
      }}>
        <h3 style={{ margin: 0, color: "#E65100" }}>
          🥗 Nutrition & Diet Management
        </h3>
        <div style={{
          padding: "6px 12px",
          borderRadius: 20,
          backgroundColor: complianceScore >= 80 ? "#e8f5e9" :
                          complianceScore >= 50 ? "#fff3e0" : "#ffebee",
          color: complianceScore >= 80 ? "#2e7d32" :
                complianceScore >= 50 ? "#ef6c00" : "#c62828",
          fontSize: 14,
          fontWeight: "bold"
        }}>
          Today's Compliance: {complianceScore}%
        </div>
      </div>

      {/* Daily Tracking Section */}
      <div style={{
        backgroundColor: "white",
        padding: 12,
        borderRadius: 6,
        marginBottom: 16,
        border: "1px solid #ffcc80"
      }}>
        <h4 style={{ margin: "0 0 12px 0", color: "#E65100", fontSize: 15 }}>
          📊 Today's Intake Tracking
        </h4>

        {/* Meal Tracking */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 8,
          marginBottom: 12
        }}>
          {Object.entries(mealTracking).map(([meal, checked]) => (
            <label key={meal} style={{
              display: "flex",
              alignItems: "center",
              padding: 8,
              backgroundColor: checked ? "#fff3e0" : "#f5f5f5",
              borderRadius: 4,
              cursor: "pointer",
              border: `1px solid ${checked ? "#ff9800" : "#ddd"}`
            }}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setMealTracking(prev => ({
                  ...prev,
                  [meal]: e.target.checked
                }))}
                style={{ marginRight: 8 }}
              />
              <span style={{
                fontSize: 13,
                textTransform: "capitalize",
                color: checked ? "#e65100" : "#666"
              }}>
                {meal === "snacks" ? "Healthy Snacks" : meal}
              </span>
            </label>
          ))}
        </div>

        {/* Water Intake Tracking */}
        <div style={{
          padding: 10,
          backgroundColor: "#e3f2fd",
          borderRadius: 4,
          border: "1px solid #90caf9"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: "bold", color: "#1565c0" }}>
                💧 Water Intake:
              </span>
              <span style={{
                marginLeft: 8,
                fontSize: 16,
                fontWeight: "bold"
              }}>
                {waterIntake} / 8 glasses
              </span>
            </div>
            <button
              onClick={addWater}
              style={{
                padding: "4px 12px",
                backgroundColor: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: waterIntake < 12 ? "pointer" : "not-allowed",
                fontSize: 13
              }}
              disabled={waterIntake >= 12}
            >
              + Add Glass
            </button>
          </div>
          <div style={{
            marginTop: 8,
            height: 8,
            backgroundColor: "#e0e0e0",
            borderRadius: 4,
            overflow: "hidden"
          }}>
            <div style={{
              width: `${(waterIntake / 8) * 100}%`,
              height: "100%",
              backgroundColor: "#2196f3",
              transition: "width 0.3s"
            }} />
          </div>
        </div>
      </div>

      {/* Protocol Selection */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: "block",
          marginBottom: 8,
          fontWeight: "bold",
          fontSize: 14,
          color: "#E65100"
        }}>
          Select Dietary Protocol Based on Your Conditions:
        </label>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 10
        }}>
          {Object.entries(DIETARY_PROTOCOLS).map(([protocol, info]) => (
            <div
              key={protocol}
              onClick={() => setSelectedProtocol(protocol)}
              style={{
                padding: 12,
                border: `2px solid ${selectedProtocol === protocol ? "#ff9800" : "#e0e0e0"}`,
                borderRadius: 6,
                cursor: "pointer",
                backgroundColor: selectedProtocol === protocol ? "#fff3e0" : "white",
                transition: "all 0.2s"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 6
              }}>
                <span style={{ fontSize: 20, marginRight: 8 }}>{info.icon}</span>
                <strong style={{
                  fontSize: 14,
                  color: selectedProtocol === protocol ? "#e65100" : "#333"
                }}>
                  {protocol}
                </strong>
              </div>
              <div style={{ fontSize: 11, color: "#666" }}>
                For: {info.conditions.slice(0, 2).join(", ")}
                {info.conditions.length > 2 && "..."}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Protocol Details */}
      {selectedProtocol && (
        <div style={{
          backgroundColor: "white",
          padding: 12,
          borderRadius: 6,
          marginBottom: 16,
          border: "1px solid #ffcc80"
        }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#e65100" }}>
            {DIETARY_PROTOCOLS[selectedProtocol as keyof typeof DIETARY_PROTOCOLS].icon} {selectedProtocol} Diet Details
          </h4>

          {/* Restrictions */}
          <div style={{ marginBottom: 12 }}>
            <b style={{ fontSize: 13, color: "#d84315" }}>⚠️ Key Restrictions:</b>
            <div style={{
              marginTop: 6,
              padding: 8,
              backgroundColor: "#ffebee",
              borderRadius: 4,
              fontSize: 12
            }}>
              {Object.entries(DIETARY_PROTOCOLS[selectedProtocol as keyof typeof DIETARY_PROTOCOLS].restrictions).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 4 }}>
                  • <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                </div>
              ))}
            </div>
          </div>

          {/* Sample Meal Plan */}
          <div style={{ marginBottom: 12 }}>
            <b style={{ fontSize: 13, color: "#558b2f" }}>🍽️ Today's Suggested Meals:</b>
            <div style={{
              marginTop: 6,
              padding: 8,
              backgroundColor: "#f1f8e9",
              borderRadius: 4,
              fontSize: 12
            }}>
              {Object.entries(DIETARY_PROTOCOLS[selectedProtocol as keyof typeof DIETARY_PROTOCOLS].mealPlan).map(([meal, food]) => (
                <div key={meal} style={{ marginBottom: 4 }}>
                  • <strong>{meal.charAt(0).toUpperCase() + meal.slice(1)}:</strong> {food}
                </div>
              ))}
            </div>
          </div>

          {/* Foods to Avoid */}
          <div>
            <b style={{ fontSize: 13, color: "#c62828" }}>🚫 Foods to Avoid:</b>
            <div style={{
              marginTop: 6,
              display: "flex",
              flexWrap: "wrap",
              gap: 6
            }}>
              {DIETARY_PROTOCOLS[selectedProtocol as keyof typeof DIETARY_PROTOCOLS].warningFoods.map((food, idx) => (
                <span key={idx} style={{
                  padding: "3px 8px",
                  backgroundColor: "#ffcdd2",
                  borderRadius: 12,
                  fontSize: 11,
                  color: "#c62828"
                }}>
                  {food}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Instructions */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: "block",
          marginBottom: 6,
          fontWeight: "bold",
          fontSize: 14
        }}>
          Additional Dietary Instructions or Allergies:
        </label>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="List any food allergies, intolerances, or specific instructions from your healthcare provider..."
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ddd",
            fontSize: 13,
            minHeight: 60
          }}
        />
      </div>

      {/* Symptom Tracking */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: "block",
          marginBottom: 6,
          fontWeight: "bold",
          fontSize: 14
        }}>
          Diet-Related Symptoms to Monitor:
        </label>
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Note any symptoms after eating (bloating, shortness of breath, swelling, blood sugar changes)..."
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ddd",
            fontSize: 13,
            minHeight: 50
          }}
        />
      </div>

      {/* Educational Tips */}
      <div style={{
        backgroundColor: "#fff9c4",
        padding: 12,
        borderRadius: 6,
        marginBottom: 16,
        border: "1px solid #fbc02d"
      }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#f57f17", fontSize: 14 }}>
          💡 Nutrition Tips for ED Prevention:
        </h4>
        <ul style={{
          margin: "0 0 0 20px",
          padding: 0,
          fontSize: 12,
          lineHeight: 1.6
        }}>
          <li>Consistent meal timing helps stabilize blood sugar and energy</li>
          <li>Proper hydration prevents confusion and weakness</li>
          <li>Following dietary restrictions prevents disease exacerbations</li>
          <li>Keep a food diary to identify trigger foods</li>
          <li>Prepare meals in advance when feeling well</li>
          <li>Ask for dietitian referral if struggling with diet management</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleCreateNutritionOrder}
          disabled={busy || !selectedProtocol}
          style={{
            padding: "10px 20px",
            backgroundColor: selectedProtocol ? "#ff9800" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: selectedProtocol ? "pointer" : "not-allowed",
            fontSize: 14,
            fontWeight: "bold"
          }}
        >
          {busy ? "Creating..." : "Save Nutrition Plan"}
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div style={{
          marginTop: 12,
          padding: 10,
          backgroundColor: message.includes("Error") ? "#ffebee" : "#e8f5e9",
          borderRadius: 4,
          color: message.includes("Error") ? "#c62828" : "#2e7d32",
          fontSize: 13
        }}>
          {message}
        </div>
      )}

      {/* Footer Note */}
      <div style={{
        marginTop: 16,
        fontSize: 11,
        color: "#666",
        fontStyle: "italic",
        textAlign: "center",
        padding: "8px 0",
        borderTop: "1px solid #e0e0e0"
      }}>
        Proper nutrition management is essential for controlling chronic conditions and preventing
        emergency department visits. Consult with a registered dietitian for personalized guidance.
      </div>
    </div>
  );
};

export default NutritionPlanner;