/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */

import { Editor, MarkdownView, Notice } from 'obsidian';

import BetterHeading from './main';
import { CodeBlockJudge } from 'code-block-judge';
import { EnhancedEditor } from 'enhanced-editor'

export class HeadingServer {
    plugin: BetterHeading;
    readonly HeadingTagRegex = /^#{0,6} ?(?=.)/gm;
    constructor(plugin: BetterHeading) {
        this.plugin = plugin
        this.addCommand()
    }
    addCommand() {
        this.plugin.addCommand({
            id: "批量提高标题层级HigherHeading",
            name: "批量提高标题层级HigherHeading",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.changeHeadingLevel(editor, true)
            }
        });
        this.plugin.addCommand({
            id: "批量降低标题层级LowerHeading",
            name: "批量降低标题层级LowerHeading",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.changeHeadingLevel(editor, false)
            }
        });
        this.plugin.addCommand({
            id: "设置标题Heading为1级",
            name: "设置标题Heading为1级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.SetHeadingLevel(1, editor);
            }
        });
        this.plugin.addCommand({
            id: "设置标题Heading为2级",
            name: "设置标题Heading为2级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.SetHeadingLevel(2, editor);
            }
        });
        this.plugin.addCommand({
            id: "设置标题Heading为3级",
            name: "设置标题Heading为3级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.SetHeadingLevel(3, editor);
            }
        });
        this.plugin.addCommand({
            id: "设置标题Heading为4级",
            name: "设置标题Heading为4级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.SetHeadingLevel(4, editor);
            }
        });
        this.plugin.addCommand({
            id: "设置标题Heading为5级",
            name: "设置标题Heading为5级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.SetHeadingLevel(5, editor);
            }
        });
        this.plugin.addCommand({
            id: "设置标题Heading为6级",
            name: "设置标题Heading为6级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.SetHeadingLevel(6, editor);
            }
        });
        this.plugin.addCommand({
            id: "循环标题Heading层级",
            name: "循环标题Heading层级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.CycleHeadingLevel(editor);
            }
        });
    }
    changeHeadingLevel(editor: Editor, higher: boolean) {
        let enhancedEditor = new EnhancedEditor(editor)
        const HeadingNotOneRegex = /(?<=\n|^)#{2,6} /g;
        const HeadingNotSixRegex = /(?<=\n|^)#{1,5} /g;
        let { endPos: endPos, startPos: startPos, txt: rawin } = enhancedEditor.GetMultiLineInSelection();
        let YAMLPOS = this.getYAMLPos(rawin);
        let textDone = rawin.replace(higher ? HeadingNotSixRegex : HeadingNotOneRegex, (matChars: string, CharPos: number) => {
            if (this.IsYAML(CharPos, startPos.line, YAMLPOS) ||
                CodeBlockJudge.IsInAnyCodeBlock(rawin, CharPos)) return matChars;
            let len = matChars.length;
            let result = '#';
            for (let i = 1; i <= len - (higher ? 3 : 1); ++i)result += '#';
            return result + ' ';
        })
        editor.replaceRange(textDone, startPos, endPos);
    }
    SetHeadingLevel(level: number, editor: Editor): void {
        let NewHeadingTag = " ";
        let Line1 = editor.getCursor("from").line;
        let Line2 = editor.getCursor("to").line;
        if (Line2 < Line1) { let temp = Line1; Line2 = Line1; Line2 = temp }
        for (let i = 1; i <= level; ++i)NewHeadingTag = "#" + NewHeadingTag
        for (; Line1 <= Line2; ++Line1) {
            let result = editor.getLine(Line1).replace(this.HeadingTagRegex, NewHeadingTag);
            editor.setLine(Line1, result);
        }
    }
    CycleHeadingLevel(editor: Editor) {
        let Line1 = editor.getCursor('from');
        let Line2 = editor.getCursor('to');
        if (Line1.ch != Line2.ch || Line1.line != Line2.line) {
            /*更改多行*/
            if (Line2.line < Line1.line) { let temp = Line2; Line2 = Line1; Line1 = temp; }
            Line1.ch = 0; Line2.ch = Infinity;
            editor.setSelection(Line2, Line1);
            let rawin = editor.getSelection();
            let YAMLPos = this.getYAMLPos(rawin);
            let result = rawin.replace(this.HeadingTagRegex, (Pre, CharPos) => {
                if (this.IsYAML(CharPos, Line1.line, YAMLPos)
                    || CodeBlockJudge.IsInAnyCodeBlock(rawin, CharPos)) return Pre;
                return this.NewHeading(Pre);
            })
            editor.replaceRange(result, Line1, Line2);
        }
        else {
            /*更改单行*/
            let rawin = editor.getLine(Line1.line);
            let result = rawin.replace(this.HeadingTagRegex, this.NewHeading)
            editor.setLine(Line1.line, result);
            editor.setCursor({ ch: Line1.ch + result.length - rawin.length, line: Line1.line });
        }
    }
    protected NewHeading(Pre: string): string {
        let len = Pre.length;
        let Old, New, result = "";
        if (!(len - 1)) Old = 0;
        else if (Pre[len - 1] == ' ') Old = len - 1;
        else Old = 0;
        New = (Old + 1) % 7;
        for (let i = 0; i < New; ++i)
            result += '#';
        if (New) result += ' ';
        return result;
    }
    getYAMLPos(rawin: string) {
        let YAMLPos: number[] = []
        rawin.replace(/(?<=\n|^)---(?=\n)/g, function (matChars, Cindex) {
            //Testlog("Cindex:"+Cindex);
            YAMLPos.push(Cindex);
            return matChars;
        })
        return YAMLPos
    }
    IsYAML(CharPos: number, Line: number, YAMLPos: number[]): boolean {
        if (Line || YAMLPos[0] == undefined) return false;
        else {//YAML只能存在于文本开头
            if (CharPos > YAMLPos[1]) return false;
            return true;
        }
    }
}
