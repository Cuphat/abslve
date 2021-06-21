specialTeams = [
  "7fcb63bc-11f2-40b9-b465-f1d458692a63", // Real Game Band
  "e3f90fa1-0bbe-40df-88ce-578d0723a23b", // FWXBC
  "a3ea6358-ce03-4f23-85f9-deb38cb81b20", // Club de Calf
  "f29d6e60-8fce-4ac6-8bc2-b5e3cabc5696", // BC Noir
  "49181b72-7f1c-4f1c-929f-928d763ad7fb", // Atlético Latte
  "4d921519-410b-41e2-882e-9726a4e54a6a", // Cold Brew Crew
  "9a5ab308-41f2-4889-a3c3-733b9aab806e", // Royal PoS
  "b3b9636a-f88a-47dc-a91d-86ecc79f9934", // Cream & Sugar United
  "3b0a289b-aebd-493c-bc11-96793e7216d5", // Pandemonium Artists
  "d2634113-b650-47b9-ad95-673f8e28e687", // Society Data Witches
  "d8f82163-2e74-496b-8e4b-2ab35b2d3ff1", // Inter Xpresso
  "a7592bd7-1d3c-4ffb-8b3a-0b1e4bc321fd", // Milk Proxy Society
  "9e42c12a-7561-42a2-b2d0-7cf81a817a5e", // Macchiato City
  "70eab4ab-6cb1-41e7-ac8b-1050ee12eecc", // Light & Sweet Electric Co.
  "4e5d0063-73b4-440a-b2d1-214a7345cf16", // Americano Water Works
  "e8f7ffee-ec53-4fe0-8e87-ea8ff1d0b4a9", // Heavy FC
  "c6c01051-cdd4-47d6-8a98-bb5b754f937f", // The Hall Stars
  "88151292-6c12-4fb8-b2d6-3e64821293b3", // Alaskan Immortals
];

function isSpecialTeam(team, invert) {
  isSpecial = specialTeams.includes(team.id);
  return invert ? !isSpecial : isSpecial;
}

function isNotSpecialTeam(team) {
  return isSpecialTeam(team, true);
}

const categoryColors = {
  general: "bad",
  batting: "poor",
  pitching: "ok",
  baserunning: "good",
  defense: "great",
  extra: "wow",
};

const centerStats = ["name", "fate", "totalFingers", "peanutAllergy", "soul"];

const uncamel = (text) => {
  var result = text.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
};

const booleanify = (val) => {
  if (val === null) {
    return "❓";
  }
  return val ? "⭕" : "❌";
};

const peanutAllergify = (val) => {
  if (val === null) {
    return "❓";
  }
  return val ? "🤢" : "🥜";
};

const integerify = (n, gameData) => {
  if (n === null) {
    return "❓";
  }
  return n.toFixed(0);
};

const rgba_to_color = (r, g, b, a) => {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const renderStars = (stars, gameData) => {
  if (gameData.forbiddenKnowledge === null) {
    var value = " ";
    var starcount = (stars * 10).toFixed(0) / 2;
    if (!gameData.fullEmojiStars) {
      return `${starcount}⭐`;
    }
    var fullstars = Math.floor(starcount);
    var halfstars = (starcount - fullstars) * 2;
    for (var i = 0; i < fullstars; i++) {
      value += "🌕 ";
    }
    for (var i = 0; i < Math.round(halfstars); i++) {
      value += "🌗 ";
    }
    for (var i = 0; i < Math.round(5 - (fullstars + halfstars)); i++) {
      value += "🌑 ";
    }
    return value;
  }
  return (
    (stars * 10).toFixed(
      gameData.forbiddenKnowledge === null
        ? 0
        : gameData.forbiddenKnowledge == "mild"
        ? 2
        : 4
    ) / 2
  );
};

const alpha = (color, alpha) => {
  var distance = 255 - color;
  if (distance === 0) {
    return 255;
  }
  return (255 - alpha * distance).toFixed(0);
};

const gameData = () => {
  return {
    teams: [],
    teamsByShorthand: { "#allPlayers": null },
    players: {},
    activeTeam: null,
    sortKey: null,
    forbiddenKnowledge: null,
    fullEmojiStars: true,
    currentColorSet: colorSets.Default,
    selectedColorSetName: "Default",
    useEmoji: true,
    init() {
      this.teams = [];
      this.players = [];
      this.hof = null;
      const localStorageColorset = localStorage.getItem("colorSet");
      if (localStorageColorset && localStorageColorset in colorSets) {
        this.selectedColorSetName = localStorageColorset;
        this.currentColorSet = colorSets[localStorageColorset];
      }
      const localStorageUseEmoji = localStorage.getItem("colorSet");
      if (
        localStorageUseEmoji === "true" ||
        localStorageUseEmoji === "false"
      ) {
        this.useEmoji = localStorageUseEmoji == "true";
      }
      if (window.location.search == mild_fk) {
        this.forbiddenKnowledge = "mild";
      } else if (window.location.search == wild_fk) {
        this.forbiddenKnowledge = "wild";
      } else {
        this.forbiddenKnowledge = null;
      }
      fetch(url.teams)
        .then((response) => response.json())
        .then((teams) => {
          this.teams.push(
            ...teams.sort((a, b) => (a.fullName > b.fullName ? 1 : -1))
          );
          for (const team of teams.filter(isNotSpecialTeam)) {
            this.teamsByShorthand[`#${team.shorthand}`] = team;
            Promise.all([
              fetchPlayers([...team.lineup], true, team),
              fetchPlayers([...team.rotation, ...team.shadows], false, team),
            ]).then((values) => {
              var newPlayers = {};
              for (var player_set of values) {
                newPlayers = Object.assign(newPlayers, player_set);
              }
              this.players = Object.assign(newPlayers, this.players);
            });
          }
          if (window.location.hash in this.teamsByShorthand) {
            this.activeTeam = this.teamsByShorthand[window.location.hash];
          } else {
            this.activeTeam = this.teamsByShorthand["#SEA"];
            window.location.hash = `#${this.activeTeam.shorthand}`;
          }
        });
      fetch(url.tribute)
        .then((response) => response.json())
        .then((players) => {
          var hof_players = players.map((player) => player.playerId);
          var hof = {
            fullName: "Hall of Flame",
            shorthand: "HOF",
            emoji: "0x1F480",
            mainColor: "#5988ff",
            secondaryColor: "#000",
            players: hof_players,
          };
          fetchPlayers(hof_players, true, hof).then((player_set) => {
            Object.assign(this.players, player_set);
          });
          this.teamsByShorthand["#HOF"] = hof;
          this.hof = hof;
        });
    },

    updateColorSet() {
      localStorage.setItem("colorSet", this.selectedColorSetName);
      this.currentColorSet = colorSets[this.selectedColorSetName];
    },
    setFk(fk) {
      if (fk == "mild") {
        var fkSearch = mild_fk;
      } else if (fk == "wild") {
        var fkSearch = wild_fk;
      } else {
        fk = null;
        var fkSearch = "";
      }
      window.history.pushState(
        {},
        "",
        `${window.location.origin}${window.location.pathname}${fkSearch}${window.location.hash}`
      );
      this.forbiddenKnowledge = fk;
    },
    categoryColor(category) {
      var color = this.currentColorSet[categoryColors[category]];
      return rgba_to_color(
        alpha(color[0], 0.6),
        alpha(color[1], 0.6),
        alpha(color[2], 0.6),
        1.0
      );
    },
    getPlayers(position) {
      var player_list = [];
      if (this.activeTeam === null) {
        for (team of this.teams) {
          for (id of team[position]) {
            if (id in this.players) {
              player_list.push(this.players[id]);
            }
          }
        }
      } else if (this.activeTeam === this.hof) {
        for (id of this.hof.players) {
          if (id in this.players) {
            player_list.push(this.players[id]);
          }
        }
      } else {
        for (id of this.activeTeam[position]) {
          if (id in this.players) {
            player_list.push(this.players[id]);
          }
        }
      }
      if (this.sortKey != null) {
        var order = (a, b) => {
          return a[this.sortKey] > b[this.sortKey] ? 1 : -1;
        };
        if (this.sortKey.charAt(0) == "-") {
          var key = this.sortKey.substring(1);
          order = (a, b) => {
            return a[key] < b[key] ? 1 : -1;
          };
        }
        player_list.sort(order);
      }
      return player_list;
    },

    teamButtonStyle(team) {
      var r, g, b, mainColor, secondaryColor;
      if (team === null) {
        r = 222;
        g = 222;
        b = 222;
        mainColor = "rgb(222, 222, 222)";
        secondaryColor = "rgb(170, 170, 170)";
      } else {
        [r, g, b] = team.mainColor.match(/\w\w/g).map((x) => parseInt(x, 16));
        secondaryColor = team.secondaryColor;
      }
      if (this.activeTeam == team) {
        return `background-color: rgba(${r}, ${g}, ${b}, 0.75); border-color: ${secondaryColor}; color: #111`;
      } else {
        return `background-color: rgba(${r}, ${g}, ${b}, 0.33); color: #666; border-color: #666;`;
      }
    },

    stlatCategories() {
      var categories = {
        general: [],
        batting: [],
        pitching: [],
        baserunning: [],
        defense: [],
        extra: [],
      };
      if (this.forbiddenKnowledge === null) {
        categories = {
          general: ["name", "stars"],
          batting: ["battingStars"],
          pitching: ["pitchingStars"],
          baserunning: ["baserunningStars"],
          defense: ["defenseStars"],
          extra: ["fate"],
        };
      } else {
        categories.general.push(...stat_categories.general);
        categories.batting.push(...stat_categories.batting);
        categories.pitching.push(...stat_categories.pitching);
        categories.baserunning.push(...stat_categories.baserunning);
        categories.defense.push(...stat_categories.defense);
        categories.extra.push(...stat_categories.extra);
      }
      if (this.activeTeam === null) {
        categories.general.splice(1, 0, "team");
      }
      return categories;
    },

    prettyStlats() {
      var result = [];
      for (const [category, stlats] of Object.entries(
        this.stlatCategories()
      )) {
        for (stlat of stlats) {
          result.push({ name: stlat, color: this.categoryColor(category) });
        }
      }
      return result;
    },

    stlatFields() {
      return [].concat.apply([], Object.values(this.stlatCategories()));
    },

    fieldRenderers: {
      stars: renderStars,
      battingStars: renderStars,
      pitchingStars: renderStars,
      baserunningStars: renderStars,
      defenseStars: renderStars,
      fate: integerify,
      totalFingers: integerify,
      soul: integerify,
      peanutAllergy: peanutAllergify,
      team: teamButtonLabel,
    },

    renderStlat(stlat, value) {
      if (stlat in this.fieldRenderers) {
        return this.fieldRenderers[stlat](value, this);
      } else if (typeof value == "number") {
        return value.toFixed(4);
      } else {
        return value;
      }
    },

    playerStlats(player) {
      const stlats = {};
      for (stlat of this.stlatFields()) {
        if (stlat === "name") {
          continue;
        }
        stlats[stlat] = {
          value: this.renderStlat(stlat, player[stlat]),
          color: this.colorStlat(stlat, player[stlat]),
        };
      }
      return stlats;
    },

    starAverages(position) {
      var averages = [];
      for ([category, stlats] of Object.entries(this.stlatCategories())) {
        if (category === "general") {
          averages.push({
            name: "general",
            value: "Star averages",
            color: null,
            colspan: stlats.length,
          });
          continue;
        }
        var sum = 0;
        var count = 0;
        var stars = `${category}Stars`;
        if (stlats.includes(stars)) {
          for (id of this.activeTeam[position]) {
            if (id in this.players) {
              sum += this.players[id][stars];
              count += 1;
            }
          }
          averages.push({
            name: stars,
            value: (this.forbiddenKnowledge === null
              ? (sum * 10).toFixed(0) / count / 2
              : (sum * 10).toFixed(4) / count / 2
            ).toFixed(2),
            color: this.colorStlat(stars, sum / count),
            colspan: stlats.length,
          });
        } else {
          averages.push({
            name: null,
            value: null,
            color: null,
            colspan: stlats.length,
          });
        }
      }
      return averages;
    },

    activePlayerCategories() {
      if (this.activeTeam === this.hof) {
        return ["players"];
      } else {
        var cats = ["lineup", "rotation"];
        if (this.forbiddenKnowledge == "wild") {
          return [...cats, "shadows"];
        }
        return cats;
      }
    },

    setSortKey(key) {
      if (this.sortKey != null) {
        if (
          this.sortKey.charAt(0) === "-" &&
          this.sortKey.substring(1) === key
        ) {
          this.sortKey = null;
          return;
        }
        if (this.sortKey == key) {
          this.sortKey = "-" + this.sortKey;
          return;
        }
      }
      this.sortKey = key;
    },

    downloadCsv() {
      var headers = [];
      for (category of Object.values(this.stlatCategories())) {
        headers = [...headers, ...category];
      }
      var rows = [headers];
      for (position of this.activePlayerCategories()) {
        var players = this.getPlayers(position);
        for (player of players) {
          var stlats = headers.map((stlatName) => {
            if (stlatName === "team") {
              return player.team.shorthand;
            }
            return player[stlatName];
          });
          rows.push(stlats);
        }
      }
      var csvContent =
        "data:text/csv;charset=utf-8," +
        rows.map((e) => e.join(",")).join("\n");
      window.open(encodeURI(csvContent));
    },
    colorStlat(stlat, value) {
      if (value === null) {
        return "rgba(255, 255, 255, 0)";
      }
      if (stlat === "peanutAllergy") {
        return rgba_to_color(
          ...(value ? this.currentColorSet.bad : this.currentColorSet.good)
        );
      }
      if (stlat in stlatColors) {
        const thresholds = Object.keys(stlatColors[stlat]).sort(
          (a, b) => a - b
        );
        for (const threshold of thresholds) {
          if (value < parseFloat(threshold)) {
            var color = stlatColors[stlat][threshold];
            return rgba_to_color(...this.currentColorSet[color]);
          }
        }
      }
      return "rgba(255, 255, 255, 0)";
    },
    getWikiColors() {
      var colors = [];
      var classes = [];
      for (const team of this.teams) {
        var team_name = team.nickname
          .replace(/ /g, "_")
          .replace(/é/g, "e")
          .replace(/&/g, "and")
          .toLowerCase();
        colors.push(`@${team_name}1: ${team.mainColor};`);
        colors.push(`@${team_name}2: ${team.secondaryColor};`);
        var [r1, g1, b1] = team.mainColor
          .match(/\w\w/g)
          .map((x) => parseInt(x, 16));
        var [r2, g2, b2] = team.secondaryColor
          .match(/\w\w/g)
          .map((x) => parseInt(x, 16));
        colors.push(`@${team_name}1_75: rgba(${r1}, ${g1}, ${b1}, 0.75);`);
        colors.push(`@${team_name}1_50: rgba(${r1}, ${g1}, ${b1}, 0.50);`);
        colors.push(`@${team_name}1_25: rgba(${r1}, ${g1}, ${b1}, 0.25);`);
        colors.push(`@${team_name}2_75: rgba(${r2}, ${g2}, ${b2}, 0.75);`);
        colors.push(`@${team_name}2_50: rgba(${r2}, ${g2}, ${b2}, 0.50);`);
        colors.push(`@${team_name}2_25: rgba(${r2}, ${g2}, ${b2}, 0.25);\n`);
        classes.push(
          `.${team_name}1_fg {\n  color: @${team_name}1 !important;\n}`
        );
        classes.push(
          `.${team_name}1_75_fg {\n  color: @${team_name}1_75 !important;\n}`
        );
        classes.push(
          `.${team_name}1_50_fg {\n  color: @${team_name}1_50 !important;\n}`
        );
        classes.push(
          `.${team_name}1_25_fg {\n  color: @${team_name}1_25 !important;\n}`
        );

        classes.push(
          `.${team_name}1_bg {\n  background-color: @${team_name}1 !important;\n}`
        );
        classes.push(
          `.${team_name}1_75_bg {\n  background-color: @${team_name}1_75 !important;\n}`
        );
        classes.push(
          `.${team_name}1_50_bg {\n  background-color: @${team_name}1_50 !important;\n}`
        );
        classes.push(
          `.${team_name}1_25_bg {\n  background-color: @${team_name}1_25 !important;\n}`
        );

        classes.push(
          `.${team_name}2_fg {\n  color: @${team_name}2 !important;\n}`
        );
        classes.push(
          `.${team_name}2_75_fg {\n  color: @${team_name}2_75 !important;\n}`
        );
        classes.push(
          `.${team_name}2_50_fg {\n  color: @${team_name}2_50 !important;\n}`
        );
        classes.push(
          `.${team_name}2_25_fg {\n  color: @${team_name}2_25 !important;\n}`
        );

        classes.push(
          `.${team_name}2_bg {\n  background-color: @${team_name}2 !important;\n}\n`
        );
        classes.push(
          `.${team_name}2_75_bg {\n  background-color: @${team_name}2_75 !important;\n}`
        );
        classes.push(
          `.${team_name}2_50_bg {\n  background-color: @${team_name}2_50 !important;\n}`
        );
        classes.push(
          `.${team_name}2_25_bg {\n  background-color: @${team_name}2_25 !important;\n}`
        );
      }
      return `${colors.join("\n")}\n\n${classes.join("\n")}`;
    },
    getWikiLightColors() {
      var colors = [];
      var classes = [];
      for (const team of this.teams) {
        var team_name = team.nickname
          .replace(/ /g, "_")
          .replace(/é/g, "e")
          .replace(/&/g, "and")
          .toLowerCase();
        colors.push(`@${team_name}1: ${team.mainColor};`);
        colors.push(`@${team_name}2: ${team.secondaryColor};`);
        var [r1, g1, b1] = team.mainColor
          .match(/\w\w/g)
          .map((x) => parseInt(x, 16));
        var [r2, g2, b2] = team.secondaryColor
          .match(/\w\w/g)
          .map((x) => parseInt(x, 16));
        var c1_brightness = r1 * 0.2126 + g1 * 0.7152 + b1 * 0.0722;
        var c2_brightness = r2 * 0.2126 + g2 * 0.7152 + b2 * 0.0722;
        // brighter
        if (c1_brightness >= c2_brightness) {
          var [rb, gb, bb] = [r1, g1, b1];
          var [rd, gd, bd] = [r2, g2, b2];
        } else {
          var [rb, gb, bb] = [r2, g2, b2];
          var [rd, gd, bd] = [r1, g1, b1];
        }
        var darkest = Math.min(c1_brightness, c2_brightness);
        var brightest = Math.max(c1_brightness, c2_brightness);
        if (brightest < 0.5) {
          classes.push(
            `.${team_name}_border {\n  border: medium solid ${team.mainColor} !important;\n}`
          );
          classes.push(
            `.${team_name}_bg {\n  background-color: rgba(${rb}, ${gb}, ${bb}, 0.5) !important;\n}`
          );
        } else {
          classes.push(
            `.${team_name}_border {\n  border: medium solid ${team.mainColor} !important;\n}`
          );
          classes.push(
            `.${team_name}_bg {\n  background-color: rgba(${rb}, ${gb}, ${bb}, 1.0) !important;\n}`
          );
        }
      }
      return `${colors.join("\n")}\n\n${classes.join("\n")}`;
    },
    getWikiDarkColors() {
      var colors = [];
      var classes = [];
      for (const team of this.teams) {
        var team_name = team.nickname
          .replace(/ /g, "_")
          .replace(/é/g, "e")
          .replace(/&/g, "and")
          .toLowerCase();
        colors.push(`@${team_name}1: ${team.mainColor};`);
        colors.push(`@${team_name}2: ${team.secondaryColor};`);
        var [r1, g1, b1] = team.mainColor
          .match(/\w\w/g)
          .map((x) => parseInt(x, 16));
        var [r2, g2, b2] = team.secondaryColor
          .match(/\w\w/g)
          .map((x) => parseInt(x, 16));
        var c1_brightness = r1 * 0.2126 + g1 * 0.7152 + b1 * 0.0722;
        var c2_brightness = r2 * 0.2126 + g2 * 0.7152 + b2 * 0.0722;
        // brighter
        if (c1_brightness >= c2_brightness) {
          var [rb, gb, bb] = [r1, g1, b1];
          var [rd, gd, bd] = [r2, g2, b2];
        } else {
          var [rb, gb, bb] = [r2, g2, b2];
          var [rd, gd, bd] = [r1, g1, b1];
        }
        var darkest = Math.min(c1_brightness, c2_brightness);
        var brightest = Math.max(c1_brightness, c2_brightness);
        if (darkest > 0.5) {
          classes.push(
            `.${team_name}_border {\n  border: medium solid ${team.mainColor} !important;\n}`
          );
          classes.push(
            `.${team_name}_bg {\n  background-color: rgba(${rd}, ${gd}, ${bd}, 0.5) !important;\n}`
          );
        } else {
          classes.push(
            `.${team_name}_border {\n  border: medium solid ${team.mainColor} !important;\n}`
          );
          classes.push(
            `.${team_name}_bg {\n  background-color: rgba(${rd}, ${gd}, ${bd}, 1.0) !important;\n}`
          );
        }
      }
      return `${colors.join("\n")}\n\n${classes.join("\n")}`;
    },
  };
};

const teamEmoji = (team) => {
  if (team === null) {
    return "⚾";
  }
  var codepoint = Number(team.emoji);
  return isNaN(codepoint) ? team.emoji : String.fromCodePoint(codepoint);
};

const teamButtonLabel = (team) => {
  return teamEmoji(team) + " " + (team ? team.shorthand : "All players");
};
