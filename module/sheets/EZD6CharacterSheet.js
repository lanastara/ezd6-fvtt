import { EZD6 } from "../config.js";
import EZItem from "../ezitem.js"
import { MiniCharSheet } from "./minicharsheet.js";
import { MiniMonsterSheet } from "./minimonstersheet.js"; "../minimonstersheet.js";

export default class EZD6CharacterSheet extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ezd6", "sheet", "character"]
        });
    }

    get template() {
        if (this.actor.type === 'monster') {
            return `systems/ezd6/templates/sheets/monster-sheet.hbs`;
        }
        else {
            return `systems/ezd6/templates/sheets/EZD6Character-sheet.hbs`;
        }
    }

    async getData(options) {
        const sheetData = await super.getData(options);
        const actorData = this.actor.toObject(false);
        sheetData.actor = actorData;
        sheetData.system = actorData.system;
        sheetData.config = EZD6;
        sheetData.enrichedDescription = await TextEditor.enrichHTML(actorData.system.description);

        this._prepareItems(sheetData);

        return sheetData;
    }

    activateListeners(html) {
        super.activateListeners(html);
        if (!this.options.editable) return;

        html.find('.minus').click(this._onMinusClick.bind(this));
        html.find('.plus').click(this._onPlusClick.bind(this));
        html.find('.item-create').click(this._onItemCreate.bind(this));
        html.find('.item-edit').click(this._onItemEdit.bind(this));
        html.find('.item-delete').click(this._onItemDelete.bind(this));
        html.find('.item-chat').click(this._onItemChat.bind(this));
        html.find('.item-minus').click(this._onItemMinusClick.bind(this));
        html.find('.item-plus').click(this._onItemPlusClick.bind(this));
        html.find('.doroll').click(this._onRoll.bind(this));
        html.find('.herodieroll').click(this._onHeroRoll.bind(this));
        html.find('.roll-cast').click(this._onRollCast.bind(this));
        html.find('.desc-chat').click(this._onDescChat.bind(this));
        html.find('.buyherodie').click(this._onBuyHeroDie.bind(this));   
        html.find('.roll-resist').click(this._onRollResist.bind(this)); 
        html.find('.strikes-minus').click(this._onStrikesMinusClick.bind(this));
        html.find('.strikes-plus').click(this._onStrikesPlusClick.bind(this)); 
        html.find('.roll-monster-magic').click(this._onRollCast.bind(this));

    }

    _prepareItems(sheetData) {
        const heropath = [];
        const species = [];
        const boon = [];
        const feature = [];
        const inclination = [];
        const aspect = [];
        const circle = [];
        const equipment_gear = [];
        const equipment_potions = [];
        const equipment_weapons = [];
        const equipment_scrolls = [];
        const equipment_magic = [];
        const equipment_other = [];
        const monsterfeatures = [];

        for (let i of sheetData.items) {
            i.img = i.img || DEFAULT_TOKEN;

            if (i.type === 'heropath') {
                heropath.push(i);
            }

            if (i.type === 'species') {
                species.push(i);
            }

            if (i.type === 'boon') {
                boon.push(i);
            }

            if (i.type === 'feature') {
                feature.push(i);
            }

            if (i.type === 'inclination') {
                inclination.push(i);
            }

            if (i.type === 'aspect') {
                aspect.push(i);
            }

            if (i.type === 'circle') {
                circle.push(i);
            }

            if (i.type === 'equipment') {
                // workaround for selectOptions injecting short name instead of long name previously used
                let x = i.system["equipmenttype"].split('.');
                let eqType = x[x.length-1].toLowerCase();
                switch (eqType) {
                    case 'gear':
                        equipment_gear.push(i);
                        break;
                    case 'weapon':
                        equipment_weapons.push(i);
                        break;
                    case 'scroll':
                        equipment_scrolls.push(i);
                        break;
                    case 'potion':
                        equipment_potions.push(i);
                        break;
                    case 'magic':
                        equipment_magic.push(i);
                        break;
                    case 'other':
                        equipment_other.push(i);
                        break;
                }
            }

            if (i.type === 'monsterfeature') {
                monsterfeatures.push(i);
            }

            sheetData.heropath = heropath;
            sheetData.species = species;
            sheetData.boon = boon;
            sheetData.feature = feature;
            sheetData.inclination = inclination;
            sheetData.aspect = aspect;
            sheetData.circle = circle;
            sheetData.equipment_gear = equipment_gear;
            sheetData.equipment_potions = equipment_potions;
            sheetData.equipment_weapons = equipment_weapons;
            sheetData.equipment_scrolls = equipment_scrolls;
            sheetData.equipment_magic = equipment_magic;
            sheetData.equipment_other = equipment_other;
            sheetData.monsterfeatures = monsterfeatures;

            sheetData.hasGear = (equipment_gear.length > 0);
            sheetData.hasPotions = (equipment_potions.length > 0);
            sheetData.hasWeapons = (equipment_weapons.length > 0);
            sheetData.hasScrolls = (equipment_scrolls.length > 0);
            sheetData.hasMagic = (equipment_magic.length > 0);
            sheetData.hasOther = (equipment_other.length > 0);

            sheetData.showCharacterToHit = game.settings.get(game.system.id, "showCharacterToHit");
            sheetData.showCharacterMagicResist = game.settings.get(game.system.id, "showCharacterMagicResist");
        }
    }

    async _onDropItemCreate(itemData) {
        const actorData = this.actor.system;

        if (this.actor.type === "character") {
            if (itemData.type === "monsterfeature") {return false;}
        } else
        {
            if (itemData.type !== "monsterfeature") {return false;}
        }
        if (itemData.type === 'heropath') {
            if (actorData.hasPath) {
                return false;
            }
            else {
                await this.actor.update({"system.heropath": itemData.name});
            }
        }

        if (itemData.type === 'species') {
            if (actorData.hasSpecies) {
                return false;
            }
            else {
                await this.actor.update({"system.species": itemData.name});
            }
            
        }
        
        return super._onDropItemCreate(itemData);
    }


    async _onMinusClick(event) {
        const actorData = this.actor.system;
        const element = event.currentTarget;
        const field = element.dataset.field;
        const updateField = "system." + field;
        
        const newVal = actorData[field] > 0 ? actorData[field] -1 : 0;
        if (newVal !== actorData[field]) { await this.actor.update({[updateField]: newVal}); };
    }

    async _onPlusClick(event) {
        const actorData = this.actor.system;
        const element = event.currentTarget;
        const field = element.dataset.field;
        const updateField = "system." + field;

        await this.actor.update({[updateField]: actorData[field]+1});
    }

    async _onStrikesMinusClick(event) {
        this.actor.removeStrike();
    }

    async _onStrikesPlusClick(event) {
        this.actor.addStrike();
    }

    async _onItemMinusClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);
        await item.removeQuantity();
    }

    async _onItemPlusClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);
        await item.addQuantity();
    }

    async _onBuyHeroDie(event) {
        event.preventDefault();
        await this.actor.buyHeroDie();
    }


    async _onItemCreate(event) {
        event.preventDefault();
        const element = event.currentTarget;
        let itemName = '';

        switch (element.dataset.type) {
            case 'heropath':
                itemName = game.i18n.localize("EZD6.NewHeroPath");
                break;
            case 'species':
                itemName = game.i18n.localize("EZD6.NewSpecies");
                break;            
            case 'boon':
                itemName = game.i18n.localize("EZD6.NewBoon");
                break;
            case 'feature':
                itemName = game.i18n.localize("EZD6.NewFeature");
                break;
            case 'inclination':
                itemName = game.i18n.localize("EZD6.NewInclination");
                break;
            case 'aspect':
                itemName = game.i18n.localize("EZD6.NewAspect");
                break;
            case 'circle':
                itemName = game.i18n.localize("EZD6.NewCircle");
                break;
            case 'equipment':
                itemName = game.i18n.localize("EZD6.NewEquipment");
                break;
            case 'monsterfeature':
                itemName = game.i18n.localize("EZD6.NewMonsterFeature");
                break;
        }

        
        const itemData = [{
            name: itemName,
            type: element.dataset.type,
            img: EZD6.ItemTypeImages[element.dataset.type]
        }];

        const newItems = await EZItem.create(itemData, { parent: this.actor });

        if (element.dataset.type === 'heropath' || element.dataset.type === 'species') {
            newItems[0].sheet.render(true);
        }

        
    }


    async _onItemEdit(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);

        item.sheet.render(true);
    }

    

    async _onItemDelete(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);
        return item.delete();
    }

    _onItemChat(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);
        const cardContent = "<h3>" + item.name + "</h3><div>" + item.system.description + "</div>";

        let chatOptions = {
            content: cardContent,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
        }

        ChatMessage.create(chatOptions);
    }

    _onDescChat(event) {
        event.preventDefault();
        const cardContent = "<h3>" + game.i18n.localize("EZD6.Description") + "</h3><div>" + this.actor.system.description + "</div>";

        let chatOptions = {
            content: cardContent,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
        }

        ChatMessage.create(chatOptions);
    }

    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        await this.actor.doRoll(dataset);
    }

    async _onHeroRoll(event) {
        event.preventDefault();

        const element = event.currentTarget;
        const dataset = element.dataset;
        await this.actor.rollHeroDie(dataset);
    }

    async _onRollCast(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        await this.actor.rollCast(dataset);
    }
    

    async _onRollResist(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        await this.actor.rollResist();
    }


    async showMini() {
        if (this.actor.type === 'monster') {
            new MiniMonsterSheet(this.actor).render(true);
        }
        else {
            new MiniCharSheet(this.actor).render(true);
        }
    }


    
}