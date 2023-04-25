/* eslint-disable @typescript-eslint/no-empty-interface */
import { HeadingServer } from './heading';
import { Plugin } from 'obsidian';

// Remember to rename these classes and interfaces!

interface SETTINGS {

}

const DEFAULT_SETTINGS: SETTINGS = {

}

export default class BetterHeading extends Plugin {
	settings: SETTINGS;

	async onload() {
		await this.loadSettings();
		this.Init()
	}
	Init() {
		new HeadingServer(this)
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}