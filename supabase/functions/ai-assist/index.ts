import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, text, projectContext, projectName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";
    const tools: any[] = [];
    let tool_choice: any = undefined;

    if (type === "extract-bid-info") {
      systemPrompt = `You are a Nepal PPMO bidding document expert. Extract key information from bid document text. 
Focus on: project name, employer name & address, IFB number, contract ID, submission deadline, bid validity period, 
completion period (days), commencement period (days), bid security amount, performance security %, estimated cost, 
and whether it's a JV-eligible bid. Also extract any BOQ items you can find with description, unit, quantity.
All monetary amounts should be in NPR. Dates should be in YYYY-MM-DD format where possible.`;
      userPrompt = `Extract bid information from this document text:\n\n${text}`;
      tools.push({
        type: "function",
        function: {
          name: "extract_bid_info",
          description: "Extract structured bid information from document text",
          parameters: {
            type: "object",
            properties: {
              projectName: { type: "string", description: "Full project name" },
              employer: { type: "string", description: "Employer/Procuring Entity name" },
              employerAddress: { type: "string", description: "Employer address" },
              ifbNumber: { type: "string", description: "Invitation for Bid number" },
              contractId: { type: "string", description: "Contract identification number" },
              submissionDeadline: { type: "string", description: "Submission deadline date (YYYY-MM-DD)" },
              bidValidity: { type: "string", description: "Bid validity period in days" },
              completionPeriod: { type: "string", description: "Completion period in days" },
              commencementDays: { type: "string", description: "Commencement period in days" },
              bidSecurityAmount: { type: "string", description: "Bid security amount in NPR" },
              performanceSecurityPercent: { type: "string", description: "Performance security percentage" },
              estimatedCost: { type: "string", description: "Estimated cost in NPR" },
              isJV: { type: "boolean", description: "Whether JV is allowed/required" },
              boqItems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    unit: { type: "string" },
                    quantity: { type: "number" },
                  },
                  required: ["description"],
                },
              },
            },
            required: ["projectName"],
            additionalProperties: false,
          },
        },
      });
      tool_choice = { type: "function", function: { name: "extract_bid_info" } };
    } else if (type === "suggest-methodology") {
      systemPrompt = `You are a Nepal construction bid preparation expert. Generate a professional method statement 
for Nepal PPMO standard bidding documents. Write in English, be specific to the project type, and follow 
standard PPMO SBD format. Include sections: Introduction, Construction Methodology, Quality Control, 
Safety Measures, Traffic Management (if road project), Environmental Management.`;
      userPrompt = `Generate a detailed method statement for this project:\n\nProject: ${projectContext?.projectName || "Road Construction"}\nBid Type: ${projectContext?.bidType || "NCB"}\nCompletion Period: ${projectContext?.completionPeriod || "___"} days\n\nAdditional context: ${text || "Standard road construction project in Nepal"}`;
    } else if (type === "suggest-site-organization") {
      systemPrompt = `You are a Nepal construction bid preparation expert. Generate a site organization plan 
for Nepal PPMO standard bidding documents. Include organizational structure, key personnel table with 
qualifications, and equipment list appropriate for the project type.`;
      userPrompt = `Generate site organization for:\n\nProject: ${projectContext?.projectName || "Road Construction"}\nBid Amount: NPR ${projectContext?.bidAmount || "___"}\n\nContext: ${text || "Standard road construction"}`;
    } else if (type === "suggest-mobilization") {
      systemPrompt = `You are a Nepal construction bid preparation expert. Generate a mobilization schedule 
and plan for Nepal PPMO standard bidding documents. Include week-by-week mobilization activities.`;
      userPrompt = `Generate mobilization plan for:\n\nProject: ${projectContext?.projectName || "Road Construction"}\nCommencement Period: ${projectContext?.commencementDays || "14"} days\n\nContext: ${text || "Standard road construction"}`;
    } else if (type === "parse-boq") {
      systemPrompt = `You are a Nepal construction BoQ (Bill of Quantities) parser expert. Parse the provided BoQ data and return structured items. 
Categorize each item into one of: Earthwork, Pavement, Drainage, Structure, Bridge, Protection, Furniture, Mobilization, General.
Extract: SN, description, unit, quantity, rate, amount. If rate/amount are missing, set to 0.`;
      userPrompt = `Parse this BoQ data for project "${projectName || 'Construction Project'}":\n\n${text}`;
      tools.push({
        type: "function",
        function: {
          name: "parse_boq_items",
          description: "Return parsed and categorized BoQ items",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sn: { type: "string" },
                    description: { type: "string" },
                    unit: { type: "string" },
                    quantity: { type: "number" },
                    rate: { type: "number" },
                    amount: { type: "number" },
                    category: { type: "string", enum: ["Earthwork", "Pavement", "Drainage", "Structure", "Bridge", "Protection", "Furniture", "Mobilization", "General"] },
                  },
                  required: ["sn", "description", "unit", "quantity"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
        },
      });
      tool_choice = { type: "function", function: { name: "parse_boq_items" } };
    } else if (type === "generate-schedule") {
      systemPrompt = `You are a Nepal construction project scheduling expert (CPM/PERT). Given a list of BOQ items with descriptions, quantities, and amounts, generate a proper construction work schedule.

Rules for scheduling:
1. Group related BOQ items into logical construction activities (e.g., all earthwork items → "Earthwork - Excavation & Fill")
2. Assign realistic durations in weeks based on quantities and Nepal construction standards
3. Define proper predecessor dependencies using Finish-to-Start (FS) relationships
4. Activities should follow logical construction sequence: mobilization → earthwork → subbase → base → surfacing → structures → finishing
5. Allow parallel activities where realistic (e.g., drainage can run parallel to earthwork)
6. Mark activities with high amounts (>10% of total) as major/critical
7. Total schedule should fit within the given total project duration
8. Each activity needs: name, duration (weeks), predecessors (by index), and whether it's a major item
9. Use standard Nepal DoR/PPMO activity naming conventions`;

      const boqList = Array.isArray(text) ? text : [];
      const totalWeeks = projectContext?.totalDurationWeeks || 24;
      userPrompt = `Generate a construction work schedule for project "${projectContext?.projectName || 'Road Construction'}" with total duration ${totalWeeks} weeks.

BOQ Items:
${boqList.map((item: any, i: number) => `${i + 1}. ${item.description} | Unit: ${item.unit} | Qty: ${item.quantity} | Amount: NPR ${item.amount}`).join('\n')}

Return activities with proper sequencing, dependencies (predecessor indices), and realistic durations that fit within ${totalWeeks} weeks total.`;

      tools.push({
        type: "function",
        function: {
          name: "generate_work_schedule",
          description: "Generate a construction work schedule with activities, durations, and dependencies",
          parameters: {
            type: "object",
            properties: {
              activities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Activity name in standard format" },
                    duration: { type: "number", description: "Duration in weeks" },
                    predecessors: { type: "array", items: { type: "number" }, description: "0-based indices of predecessor activities" },
                    isMajor: { type: "boolean", description: "Whether this is a major/critical activity" },
                    linkType: { type: "string", enum: ["FS", "SS", "FF", "SF"], description: "Dependency type (default FS)" },
                    lag: { type: "number", description: "Lag in weeks (0 if none)" },
                    boqItemIndices: { type: "array", items: { type: "number" }, description: "Which BOQ items this activity covers" },
                  },
                  required: ["name", "duration", "predecessors", "isMajor"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string", description: "Brief summary of the scheduling logic" },
            },
            required: ["activities", "summary"],
            additionalProperties: false,
          },
        },
      });
      tool_choice = { type: "function", function: { name: "generate_work_schedule" } };
    } else {
      return new Response(JSON.stringify({ error: "Unknown type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    if (tools.length > 0) {
      body.tools = tools;
      body.tool_choice = tool_choice;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Handle tool call responses
    if (type === "extract-bid-info" || type === "parse-boq" || type === "generate-schedule") {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const extracted = JSON.parse(toolCall.function.arguments);
        let result;
        if (type === "parse-boq") result = extracted.items;
        else if (type === "generate-schedule") result = extracted;
        else result = extracted;
        return new Response(JSON.stringify({ result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // For text generation responses
    const content = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
