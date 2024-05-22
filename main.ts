import { Plugin, MarkdownView, Notice, PluginSettingTab, Setting, App, EditorPosition } from 'obsidian';

interface TextAnimateSettings {
  speed: number;
}

const DEFAULT_SETTINGS: TextAnimateSettings = {
  speed: 50
};

export default class TextAnimatePlugin extends Plugin {
  settings: TextAnimateSettings;
  originalContent: string = '';
  isActive: number = 1;

  async onload() {
    console.log('Loading Text Animate Plugin');

    await this.loadSettings();

    this.addCommand({
      id: 'animate-text',
      name: 'Animate Text',
      callback: () => this.animateText(),
    });

    this.addRibbonIcon('pencil', 'Animate Text', async () => {
	this.isActive = 1;
      this.animateText();
    });

    this.addSettingTab(new TextAnimateSettingTab(this.app, this));
	
	window.addEventListener('keydown', (event: KeyboardEvent) => {
		if (event.keyCode === 27) {
			this.isActive = 0;
		}
	});
  
}

  onunload() {
    console.log('Unloading Text Animate Plugin');
  }

  async animateText() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      const content = editor.getValue();
	  this.originalContent = editor.getValue();
      editor.setValue(''); 

      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < content.length && this.isActive === 1) {
          const pos: EditorPosition = editor.offsetToPos(currentIndex);
          editor.replaceRange(content[currentIndex], pos);
          editor.setCursor(pos); 
          const range = { from: pos, to: pos }; 
          editor.scrollIntoView(range);
          currentIndex++;
        } else {
          clearInterval(interval);
		  this.cancelAnimation()
        }
      }, this.settings.speed);
    } else {
      new Notice('No active markdown view to animate.');
    }
  }

  cancelAnimation() {
	this.isActive = 1;
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
        const editor = activeView.editor;
        editor.setValue(this.originalContent); 
    }
}
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class TextAnimateSettingTab extends PluginSettingTab {
  plugin: TextAnimatePlugin;

  constructor(app: App, plugin: TextAnimatePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Text Animate Plugin Settings' });

    new Setting(containerEl)
      .setName('Animation Speed')
      .setDesc('Set the speed of the animation (in milliseconds per character).')
      .addText(text => text
        .setPlaceholder('50')
        .setValue(this.plugin.settings.speed.toString())
        .onChange(async (value) => {
          this.plugin.settings.speed = parseInt(value);
          await this.plugin.saveSettings();
        }));
  }
}
