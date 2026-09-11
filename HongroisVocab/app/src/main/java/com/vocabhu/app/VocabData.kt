package com.vocabhu.app

data class VocabWord(val hu: String, val fr: String)

data class VocabCategory(val name: String, val words: List<VocabWord>)

val vocabCategories: List<VocabCategory> = listOf(
    VocabCategory(
        name = "Adverbes",
        words = listOf(
            VocabWord("gyorsan", "vite"),
            VocabWord("lassan", "lentement"),
            VocabWord("most", "maintenant"),
            VocabWord("holnap", "demain"),
            VocabWord("tegnap", "hier"),
            VocabWord("ma", "aujourd'hui"),
            VocabWord("itt", "ici"),
            VocabWord("ott", "là-bas"),
            VocabWord("mindig", "toujours"),
            VocabWord("soha", "jamais"),
            VocabWord("gyakran", "souvent"),
            VocabWord("ritkán", "rarement"),
        )
    ),
    VocabCategory(
        name = "Adjectifs",
        words = listOf(
            VocabWord("nagy", "grand"),
            VocabWord("kicsi", "petit"),
            VocabWord("szép", "beau"),
            VocabWord("csúnya", "laid"),
            VocabWord("jó", "bon"),
            VocabWord("rossz", "mauvais"),
            VocabWord("gyors", "rapide"),
            VocabWord("lassú", "lent"),
            VocabWord("meleg", "chaud"),
            VocabWord("hideg", "froid"),
            VocabWord("új", "nouveau"),
            VocabWord("régi", "vieux"),
        )
    ),
    VocabCategory(
        name = "Sports",
        words = listOf(
            VocabWord("foci", "football"),
            VocabWord("kosárlabda", "basket-ball"),
            VocabWord("úszás", "natation"),
            VocabWord("tenisz", "tennis"),
            VocabWord("futás", "course à pied"),
            VocabWord("kerékpározás", "cyclisme"),
            VocabWord("síelés", "ski"),
            VocabWord("box", "boxe"),
            VocabWord("röplabda", "volley-ball"),
            VocabWord("jégkorong", "hockey sur glace"),
        )
    ),
    VocabCategory(
        name = "Animaux",
        words = listOf(
            VocabWord("kutya", "chien"),
            VocabWord("macska", "chat"),
            VocabWord("ló", "cheval"),
            VocabWord("tehén", "vache"),
            VocabWord("disznó", "cochon"),
            VocabWord("madár", "oiseau"),
            VocabWord("hal", "poisson"),
            VocabWord("nyúl", "lapin"),
            VocabWord("róka", "renard"),
            VocabWord("medve", "ours"),
            VocabWord("oroszlán", "lion"),
            VocabWord("elefánt", "éléphant"),
        )
    ),
    VocabCategory(
        name = "Végétation",
        words = listOf(
            VocabWord("fa", "arbre"),
            VocabWord("virág", "fleur"),
            VocabWord("fű", "herbe"),
            VocabWord("levél", "feuille"),
            VocabWord("erdő", "forêt"),
            VocabWord("bokor", "buisson"),
            VocabWord("gyökér", "racine"),
            VocabWord("mag", "graine"),
        )
    ),
    VocabCategory(
        name = "Nourriture",
        words = listOf(
            VocabWord("kenyér", "pain"),
            VocabWord("víz", "eau"),
            VocabWord("hús", "viande"),
            VocabWord("sajt", "fromage"),
            VocabWord("alma", "pomme"),
            VocabWord("tej", "lait"),
            VocabWord("leves", "soupe"),
            VocabWord("tojás", "œuf"),
            VocabWord("rizs", "riz"),
            VocabWord("zöldség", "légume"),
            VocabWord("gyümölcs", "fruit"),
            VocabWord("cukor", "sucre"),
        )
    ),
)
