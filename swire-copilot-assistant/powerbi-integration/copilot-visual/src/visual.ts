/*
 * Swire Copilot Chat Visual for Power BI
 * Provides embedded chat interface with context-aware responses
 */

"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingutils";
import { VisualSettings } from "./settings";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataView = powerbi.DataView;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

export class SwireCopilotVisual implements IVisual {
  private target: HTMLElement;
  private host: IVisualHost;
  private formattingSettings: VisualSettings;
  private formattingSettingsService: FormattingSettingsService;
  private chatContainer: HTMLElement;
  private chatMessages: HTMLElement;
  private chatInput: HTMLInputElement;
  private sendButton: HTMLButtonElement;
  private suggestionsContainer: HTMLElement;
  private contextData: any[] = [];
  private isInitialized: boolean = false;

  constructor(options: VisualConstructorOptions) {
    this.target = options.element;
    this.host = options.host;
    this.formattingSettingsService = new FormattingSettingsService();

    this.initializeChat();
  }

  private initializeChat(): void {
    // Create main chat container
    this.chatContainer = document.createElement("div");
    this.chatContainer.className = "swire-copilot-container";

    // Create chat header
    const chatHeader = document.createElement("div");
    chatHeader.className = "chat-header";
    chatHeader.innerHTML = `
            <div class="header-content">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMDA3OEQ0Ii8+Cjwvc3ZnPgo=" alt="Swire Copilot" class="copilot-icon">
                <span class="copilot-title">Swire Intelligence Assistant</span>
                <button class="minimize-btn" title="Minimize Chat">−</button>
            </div>
        `;

    // Create messages container
    this.chatMessages = document.createElement("div");
    this.chatMessages.className = "chat-messages";

    // Create input container
    const inputContainer = document.createElement("div");
    inputContainer.className = "chat-input-container";

    this.chatInput = document.createElement("input");
    this.chatInput.type = "text";
    this.chatInput.className = "chat-input";
    this.chatInput.placeholder = "Ask about this report data...";

    this.sendButton = document.createElement("button");
    this.sendButton.className = "send-button";
    this.sendButton.innerHTML = "📤";
    this.sendButton.title = "Send Message";

    // Create suggestions container
    this.suggestionsContainer = document.createElement("div");
    this.suggestionsContainer.className = "suggestions-container";

    // Assemble the chat interface
    inputContainer.appendChild(this.chatInput);
    inputContainer.appendChild(this.sendButton);

    this.chatContainer.appendChild(chatHeader);
    this.chatContainer.appendChild(this.chatMessages);
    this.chatContainer.appendChild(this.suggestionsContainer);
    this.chatContainer.appendChild(inputContainer);

    this.target.appendChild(this.chatContainer);

    // Add event listeners
    this.setupEventListeners();

    // Add initial welcome message
    this.addWelcomeMessage();

    this.isInitialized = true;
  }

  private setupEventListeners(): void {
    // Send message on button click
    this.sendButton.addEventListener("click", () => {
      this.sendMessage();
    });

    // Send message on Enter key
    this.chatInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        this.sendMessage();
      }
    });

    // Minimize/maximize functionality
    const minimizeBtn = this.chatContainer.querySelector(
      ".minimize-btn"
    ) as HTMLButtonElement;
    minimizeBtn.addEventListener("click", () => {
      this.toggleChatVisibility();
    });

    // Auto-resize input
    this.chatInput.addEventListener("input", () => {
      this.adjustInputHeight();
    });
  }

  private addWelcomeMessage(): void {
    const welcomeMessage = {
      type: "assistant",
      content:
        "Hello! I'm the Swire Intelligence Assistant. I can help you understand and analyze the data in this Power BI report. What would you like to know?",
      timestamp: new Date(),
    };

    this.addMessageToChat(welcomeMessage);
    this.showContextSuggestions();
  }

  private showContextSuggestions(): void {
    if (!this.formattingSettings?.chatSettings?.showSuggestions?.value) {
      return;
    }

    const suggestions = this.generateContextSuggestions();
    this.suggestionsContainer.innerHTML = "";

    if (suggestions.length > 0) {
      const suggestionsTitle = document.createElement("div");
      suggestionsTitle.className = "suggestions-title";
      suggestionsTitle.textContent = "💡 Try asking:";
      this.suggestionsContainer.appendChild(suggestionsTitle);

      suggestions.forEach((suggestion) => {
        const suggestionBtn = document.createElement("button");
        suggestionBtn.className = "suggestion-btn";
        suggestionBtn.textContent = suggestion;
        suggestionBtn.addEventListener("click", () => {
          this.chatInput.value = suggestion;
          this.sendMessage();
        });
        this.suggestionsContainer.appendChild(suggestionBtn);
      });
    }
  }

  private generateContextSuggestions(): string[] {
    const suggestions: string[] = [];

    if (this.contextData.length > 0) {
      // Generate suggestions based on available data
      const hasRevenue = this.contextData.some((d) =>
        d.category?.toLowerCase().includes("revenue")
      );
      const hasExpenses = this.contextData.some((d) =>
        d.category?.toLowerCase().includes("expense")
      );
      const hasSafety = this.contextData.some(
        (d) =>
          d.category?.toLowerCase().includes("safety") ||
          d.category?.toLowerCase().includes("hse")
      );

      if (hasRevenue) {
        suggestions.push("What's driving the revenue trends?");
        suggestions.push("Compare revenue across departments");
      }

      if (hasExpenses) {
        suggestions.push("Which expense categories are highest?");
        suggestions.push("Show expense variance analysis");
      }

      if (hasSafety) {
        suggestions.push("Analyze safety performance trends");
        suggestions.push("What are the key safety insights?");
      }

      // Generic suggestions
      suggestions.push("Summarize the key insights from this data");
      suggestions.push("What patterns do you see in this report?");
      suggestions.push("Generate recommendations based on this data");
    } else {
      // Default suggestions when no context data
      suggestions.push("What can you tell me about this report?");
      suggestions.push("Help me understand the key metrics");
      suggestions.push("Show me the most important insights");
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  private async sendMessage(): Promise<void> {
    const message = this.chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    const userMessage = {
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    this.addMessageToChat(userMessage);

    // Clear input and show typing indicator
    this.chatInput.value = "";
    this.showTypingIndicator();

    try {
      // Send message to Copilot API with context
      const response = await this.callCopilotAPI(message);

      // Remove typing indicator and add response
      this.removeTypingIndicator();
      const assistantMessage = {
        type: "assistant",
        content: response.content,
        timestamp: new Date(),
        actions: response.actions,
      };
      this.addMessageToChat(assistantMessage);
    } catch (error) {
      this.removeTypingIndicator();
      const errorMessage = {
        type: "assistant",
        content:
          "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true,
      };
      this.addMessageToChat(errorMessage);
    }
  }

  private async callCopilotAPI(message: string): Promise<any> {
    const endpoint =
      this.formattingSettings?.integration?.copilotEndpoint?.value ||
      "https://swire-copilot-api.azurewebsites.net/api/chat";

    const requestBody = {
      message: message,
      context: this.getReportContext(),
      userId: this.host.createSelectionIdBuilder().createSelectionId(),
      reportId: this.host.hostCapabilities?.webGL
        ? "powerbi-report"
        : "unknown",
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await this.getAccessToken()}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return await response.json();
  }

  private getReportContext(): any {
    return {
      data: this.contextData,
      visualType: "copilot-chat",
      reportMetadata: {
        hasData: this.contextData.length > 0,
        dataPoints: this.contextData.length,
        categories: this.extractCategories(),
        metrics: this.extractMetrics(),
      },
    };
  }

  private extractCategories(): string[] {
    return [
      ...new Set(this.contextData.map((d) => d.category).filter(Boolean)),
    ];
  }

  private extractMetrics(): string[] {
    return [...new Set(this.contextData.map((d) => d.metric).filter(Boolean))];
  }

  private async getAccessToken(): Promise<string> {
    // In a real implementation, this would get the proper access token
    // For now, return a placeholder
    return "placeholder-token";
  }

  private addMessageToChat(message: any): void {
    const messageElement = document.createElement("div");
    messageElement.className = `chat-message ${message.type}${message.isError ? " error" : ""}`;

    const timestamp = message.timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessageContent(message.content)}</div>
                <div class="message-timestamp">${timestamp}</div>
            </div>
        `;

    // Add action buttons if present
    if (message.actions && message.actions.length > 0) {
      const actionsContainer = document.createElement("div");
      actionsContainer.className = "message-actions";

      message.actions.forEach((action: any) => {
        const actionBtn = document.createElement("button");
        actionBtn.className = "action-btn";
        actionBtn.textContent = action.title;
        actionBtn.addEventListener("click", () => {
          this.handleMessageAction(action);
        });
        actionsContainer.appendChild(actionBtn);
      });

      messageElement.appendChild(actionsContainer);
    }

    this.chatMessages.appendChild(messageElement);
    this.scrollToBottom();
  }

  private formatMessageContent(content: string): string {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  }

  private handleMessageAction(action: any): void {
    switch (action.type) {
      case "drilldown":
        this.performDrilldown(action.data);
        break;
      case "filter":
        this.applyFilter(action.data);
        break;
      case "export":
        this.exportData(action.data);
        break;
      case "navigate":
        window.open(action.url, "_blank");
        break;
      default:
        console.log("Unknown action type:", action.type);
    }
  }

  private performDrilldown(data: any): void {
    // Implement drilldown functionality
    console.log("Performing drilldown:", data);
  }

  private applyFilter(data: any): void {
    // Implement filter functionality
    console.log("Applying filter:", data);
  }

  private exportData(data: any): void {
    // Implement export functionality
    console.log("Exporting data:", data);
  }

  private showTypingIndicator(): void {
    const typingElement = document.createElement("div");
    typingElement.className = "chat-message assistant typing";
    typingElement.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
    this.chatMessages.appendChild(typingElement);
    this.scrollToBottom();
  }

  private removeTypingIndicator(): void {
    const typingElement = this.chatMessages.querySelector(".typing");
    if (typingElement) {
      typingElement.remove();
    }
  }

  private scrollToBottom(): void {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  private toggleChatVisibility(): void {
    const minimizeBtn = this.chatContainer.querySelector(
      ".minimize-btn"
    ) as HTMLButtonElement;
    const isMinimized = this.chatContainer.classList.contains("minimized");

    if (isMinimized) {
      this.chatContainer.classList.remove("minimized");
      minimizeBtn.textContent = "−";
      minimizeBtn.title = "Minimize Chat";
    } else {
      this.chatContainer.classList.add("minimized");
      minimizeBtn.textContent = "+";
      minimizeBtn.title = "Maximize Chat";
    }
  }

  private adjustInputHeight(): void {
    this.chatInput.style.height = "auto";
    this.chatInput.style.height =
      Math.min(this.chatInput.scrollHeight, 100) + "px";
  }

  public update(options: VisualUpdateOptions): void {
    this.formattingSettings =
      this.formattingSettingsService.populateFormattingSettingsModel(
        VisualSettings,
        options.dataViews
      );

    // Update context data from Power BI
    if (options.dataViews && options.dataViews[0]) {
      this.updateContextData(options.dataViews[0]);
    }

    // Apply formatting settings
    this.applyFormattingSettings();

    // Update suggestions based on new context
    if (this.isInitialized) {
      this.showContextSuggestions();
    }
  }

  private updateContextData(dataView: DataView): void {
    this.contextData = [];

    if (dataView.categorical) {
      const categories = dataView.categorical.categories;
      const values = dataView.categorical.values;

      if (categories && values) {
        for (let i = 0; i < categories[0].values.length; i++) {
          const dataPoint: any = {
            category: categories[0].values[i],
            index: i,
          };

          values.forEach((valueColumn, valueIndex) => {
            dataPoint[`metric_${valueIndex}`] = valueColumn.values[i];
            dataPoint.metric = valueColumn.source.displayName;
          });

          this.contextData.push(dataPoint);
        }
      }
    }
  }

  private applyFormattingSettings(): void {
    if (!this.formattingSettings) return;

    const chatSettings = this.formattingSettings.chatSettings;
    const appearance = this.formattingSettings.appearance;

    // Apply chat position
    if (chatSettings.chatPosition) {
      this.chatContainer.className = `swire-copilot-container position-${chatSettings.chatPosition.value}`;
    }

    // Apply height
    if (chatSettings.chatHeight && chatSettings.chatHeight.value) {
      this.chatContainer.style.height = `${chatSettings.chatHeight.value}px`;
    }

    // Apply theme
    if (appearance.theme) {
      this.chatContainer.setAttribute("data-theme", appearance.theme.value);
    }

    // Apply primary color
    if (appearance.primaryColor) {
      this.chatContainer.style.setProperty(
        "--primary-color",
        appearance.primaryColor.value.value
      );
    }

    // Apply font size
    if (appearance.fontSize && appearance.fontSize.value) {
      this.chatContainer.style.fontSize = `${appearance.fontSize.value}px`;
    }
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.formattingSettingsService.buildFormattingModel(
      this.formattingSettings
    );
  }
}
