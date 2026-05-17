import React, { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

interface ScientificCalculatorProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

const ScientificCalculator = ({
  visible,
  onClose,
  isDark,
}: ScientificCalculatorProps) => {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [memory, setMemory] = useState(0);

  const handlePress = (val: string) => {
    if (display === "Error" || display === "Infinity") {
      setDisplay(val === "." ? "0." : val);
      setExpression(val === "." ? "0." : val);
      return;
    }

    if (display === "0" && !isNaN(Number(val))) {
      setDisplay(val);
      setExpression(val);
    } else {
      setDisplay((prev) => prev + val);
      setExpression((prev) => prev + val);
    }
  };

  const handleFunc = (func: string) => {
    if (display === "Error") return;
    setExpression((prev) => prev + func + "(");
    setDisplay((prev) => prev + func + "(");
  };

  const handleClear = () => {
    setDisplay("0");
    setExpression("");
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay((prev) => prev.slice(0, -1));
      setExpression((prev) => prev.slice(0, -1));
    } else {
      setDisplay("0");
      setExpression("");
    }
  };

  const calculate = () => {
    try {
      let processed = expression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/√\(/g, "Math.sqrt(")
        .replace(/π/g, "Math.PI")
        .replace(/e/g, "Math.E")
        .replace(/\^/g, "**");

      // Auto-close parentheses
      const openCount = (processed.match(/\(/g) || []).length;
      const closeCount = (processed.match(/\)/g) || []).length;
      for (let i = 0; i < openCount - closeCount; i++) {
        processed += ")";
      }

      // eslint-disable-next-line no-eval
      const result = eval(processed);
      const finalResult = Number.isInteger(result)
        ? result.toString()
        : parseFloat(result.toFixed(8)).toString();

      setDisplay(finalResult);
      setExpression(finalResult);
    } catch (e) {
      setDisplay("Error");
    }
  };

  const handleMemory = (type: string) => {
    const val = parseFloat(display);
    if (isNaN(val)) return;

    if (type === "MC") setMemory(0);
    else if (type === "MR") {
      setDisplay(memory.toString());
      setExpression(memory.toString());
    } else if (type === "M+") setMemory((prev) => prev + val);
    else if (type === "M-") setMemory((prev) => prev - val);
  };

  const buttons = [
    ["sin", "cos", "tan", "log", "ln"],
    ["√", "x²", "xʸ", "n!", "π"],
    ["e", "(", ")", "MC", "MR"],
    ["7", "8", "9", "⌫", "AC"],
    ["4", "5", "6", "×", "÷"],
    ["1", "2", "3", "+", "-"],
    ["0", ".", "M+", "M-", "="],
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-slate-50 dark:bg-slate-900 w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
            <Text className="text-slate-900 dark:text-white font-black text-sm">
              Scientific Calculator
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather
                name="minimize-2"
                size={20}
                color={isDark ? "#94a3b8" : "#64748b"}
              />
            </TouchableOpacity>
          </View>

          {/* Display */}
          <View className="px-6 py-8 bg-white dark:bg-slate-950 items-end justify-center min-h-[100px]">
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              className="text-slate-900 dark:text-white text-5xl font-black"
            >
              {display}
            </Text>
          </View>

          {/* Buttons */}
          <View className="p-4 bg-slate-50 dark:bg-slate-900">
            {buttons.map((row, ridx) => (
              <View key={ridx} className="flex-row justify-between mb-2">
                {row.map((btn) => {
                  let bgColor = isDark ? "bg-slate-800" : "bg-white";
                  let textColor = isDark ? "text-slate-300" : "text-slate-700";
                  let fontWeight = "font-bold";

                  if (
                    [
                      "sin",
                      "cos",
                      "tan",
                      "log",
                      "ln",
                      "√",
                      "x²",
                      "xʸ",
                      "n!",
                      "π",
                      "e",
                      "(",
                      ")",
                      "MC",
                      "MR",
                      "M+",
                      "M-",
                    ].includes(btn)
                  ) {
                    bgColor = isDark ? "bg-slate-800/50" : "bg-slate-100";
                    textColor = isDark ? "text-slate-400" : "text-slate-500";
                    fontWeight = "font-semibold";
                  } else if (btn === "=") {
                    bgColor = "bg-orange-500";
                    textColor = "text-white";
                  } else if (btn === "AC" || btn === "⌫") {
                    textColor = "text-orange-500";
                  } else if (["+", "-", "×", "÷"].includes(btn)) {
                    textColor = "text-orange-500";
                  }

                  return (
                    <TouchableOpacity
                      key={btn}
                      onPress={() => {
                        if (btn === "=") calculate();
                        else if (btn === "AC") handleClear();
                        else if (btn === "⌫") handleBackspace();
                        else if (["MC", "MR", "M+", "M-"].includes(btn))
                          handleMemory(btn);
                        else if (
                          ["sin", "cos", "tan", "log", "ln", "√"].includes(btn)
                        )
                          handleFunc(btn);
                        else if (btn === "x²") handlePress("^2");
                        else if (btn === "xʸ") handlePress("^");
                        else if (btn === "n!") handlePress("!"); // simplified
                        else if (btn === "π") handlePress("π");
                        else if (btn === "e") handlePress("e");
                        else handlePress(btn);
                      }}
                      className={`${bgColor} h-12 w-[18%] items-center justify-center rounded-xl border border-slate-200/50 dark:border-slate-700/50`}
                    >
                      <Text className={`${textColor} ${fontWeight} text-sm`}>
                        {btn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ScientificCalculator;
