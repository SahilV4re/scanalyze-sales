"use client";

import { useState } from "react";
import axios from "axios";
import { UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const groq_key = process.env.NEXT_PUBLIC_GROQ_API_KEY;

export default function UploadPage() {
    const [file, setFile] = useState(null);
    const [cards, setCards] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError(null);
    };

    const parseCSV = (csvText) => {
        try {
            const [headerLine, ...lines] = csvText.trim().split("\n");
            const headers = headerLine.split(",").map(h => h.trim());

            return lines.filter(line => line.trim()).map((line) => {
                const values = line.split(",");
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index]?.trim() || "";
                });
                return obj;
            });
        } catch (err) {
            console.error("CSV parsing error:", err);
            throw new Error("Failed to parse CSV file. Please ensure it's properly formatted.");
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a CSV file.");
            return;
        }

        if (!groq_key) {
            setError("API key is missing. Please check your .env.local file.");
            return;
        }

        setIsLoading(true);
        setCards([]);
        setError(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const csvText = e.target.result;
                const jsonData = parseCSV(csvText);
                
                if (jsonData.length === 0) {
                    throw new Error("CSV file appears to be empty or improperly formatted.");
                }

                // Limit to first 10 rows to avoid token limits
                const sampleData = jsonData.slice(0, 10);
                const columns = Object.keys(sampleData[0] || {});
                
                console.log("Analyzing CSV:", { 
                    totalRows: jsonData.length, 
                    columns,
                    apiKeyPresent: !!groq_key
                });

                const response = await axios.post(
                    "https://api.groq.com/openai/v1/chat/completions", 
                    {
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            {
                                role: "system",
                                content: `You are a Sales Data Analyst. Analyze the data and return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "high_value_calculation": [{"column": "string", "count": 0, "suggested_fix": "string"}],
  "incorrect_tax_calculation": [{"column": "string", "count": 0, "suggested_fix": "string"}],
  "unapproved_discount": {"count": 0, "suggested_fix": "string"},
  "cancellation_fraud": [{"column": "string", "issue": "string", "suggested_fix": "string"}]
}
If no issues found, use empty arrays [] and zero counts. Return ONLY the JSON object.`
                            },
                            {
                                role: "user",
                                content: `Analyze this sales data:
Columns: ${columns.join(", ")}
Total rows: ${jsonData.length}
Sample (first ${sampleData.length} rows):
${JSON.stringify(sampleData, null, 2)}`
                            }
                        ],
                        temperature: 0.2,
                        max_tokens: 2000
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${groq_key}`
                        },
                        timeout: 30000
                    }
                );

                if (!response.data?.choices?.[0]?.message?.content) {
                    throw new Error("Invalid response from AI service");
                }

                let content = response.data.choices[0].message.content.trim();
                
                // Clean up response - remove markdown code blocks if present
                content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                
                console.log("API Response:", content);

                const analysis = JSON.parse(content);
                const formattedCards = formatAnalysisToCards(analysis);
                setCards(formattedCards);
                
            } catch (error) {
                console.error("Error details:", {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                
                let errorMessage = "Failed to analyze CSV data.";
                
                if (error.response?.data?.error?.message) {
                    errorMessage = `API Error: ${error.response.data.error.message}`;
                } else if (error.name === 'SyntaxError') {
                    errorMessage = "Failed to parse AI response. Please try again.";
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                setError(errorMessage);
                // Don't call getSampleCards() - just show error
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            setError("Failed to read file. Please try again.");
            setIsLoading(false);
        };

        reader.readAsText(file);
    };

    const formatAnalysisToCards = (analysis) => {
        const cards = [];
        
        // High Value Calculation
        if (analysis.high_value_calculation?.length > 0) {
            cards.push({
                title: "High Value Calculation",
                columns: ["Column", "Count", "Suggested Fix"],
                data: analysis.high_value_calculation.map(item => ({
                    Column: item.column || "Unknown",
                    Count: item.count?.toString() || "N/A",
                    "Suggested Fix": item.suggested_fix || "Not specified"
                }))
            });
        }
        
        // Incorrect Tax Calculation
        if (analysis.incorrect_tax_calculation?.length > 0) {
            cards.push({
                title: "Incorrect Tax Calculation",
                columns: ["Column", "Count", "Suggested Fix"],
                data: analysis.incorrect_tax_calculation.map(item => ({
                    Column: item.column || "Unknown",
                    Count: item.count?.toString() || "N/A",
                    "Suggested Fix": item.suggested_fix || "Not specified"
                }))
            });
        }
        
        // Unapproved Discount
        if (analysis.unapproved_discount && analysis.unapproved_discount.count > 0) {
            cards.push({
                title: "Unapproved Discount",
                columns: ["Count", "Suggested Fix"],
                data: [{
                    Count: analysis.unapproved_discount.count?.toString() || "N/A",
                    "Suggested Fix": analysis.unapproved_discount.suggested_fix || "Not specified"
                }]
            });
        }
        
        // Cancellation Fraud
        if (analysis.cancellation_fraud?.length > 0) {
            cards.push({
                title: "Cancellation Fraud",
                columns: ["Column", "Issue", "Suggested Fix"],
                data: analysis.cancellation_fraud.map(item => ({
                    Column: item.column || "Unknown",
                    Issue: item.issue || "Fraud detected",
                    "Suggested Fix": item.suggested_fix || "Not specified"
                }))
            });
        }
        
        // If no issues found, show success card
        if (cards.length === 0) {
            cards.push({
                title: "Data Quality Analysis",
                columns: ["Result"],
                data: [{
                    Result: "No significant anomalies detected in the data!"
                }]
            });
        }
        
        return cards;
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Audit</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <main className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
                    <div className="w-full px-4 md:px-6 py-6 bg-white border-b border-gray-200">
                        <div className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center gap-4">
                            <UploadCloud className="w-10 h-10 text-gray-500" />
                            <p className="text-gray-600 text-lg font-medium">
                                Upload a CSV file to analyze data quality
                            </p>
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="cursor-pointer bg-muted/50 text-gray-500"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleUpload}
                                disabled={isLoading || !file}
                                className="px-6 py-2 border bg-black border-black text-white rounded-md hover:bg-muted/50 hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Analyzing..." : "Analyze CSV"}
                            </button>
                            {file && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Selected file: <span className="font-medium">{file.name}</span>
                                    {isLoading && <span className="ml-2">(Processing...)</span>}
                                </p>
                            )}
                            {error && (
                                <p className="text-sm text-red-500 mt-2 text-center max-w-md">
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>

                    <ScrollArea className="flex-1 w-full px-4 md:px-6 py-6">
                        {isLoading ? (
                            <div className="w-full flex flex-col items-center justify-center py-12 gap-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                                <p className="text-gray-600">Analyzing your CSV data...</p>
                            </div>
                        ) : (
                            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {cards.map((card, index) => (
                                    <div key={index} className="border-none shadow-none bg-muted/50 rounded-xl shadow-md p-4 space-y-4 border">
                                        <h2 className="text-lg font-semibold text-gray-800">{card.title}</h2>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm text-left text-gray-600">
                                                <thead className="text-xs uppercase text-gray-500 border-b">
                                                    <tr>
                                                        {card.columns.map((col, idx) => (
                                                            <th key={idx} className="px-3 py-2 whitespace-nowrap">
                                                                {col}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {card.data.map((row, rowIdx) => (
                                                        <tr key={rowIdx} className="hover:bg-gray-50">
                                                            {card.columns.map((col, colIdx) => (
                                                                <td key={colIdx} className="px-3 py-2 whitespace-nowrap">
                                                                    {row[col] || "-"}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}