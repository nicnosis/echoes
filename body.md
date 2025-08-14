# Body system in Echoes
This document explains the design and implementation of the body system.

The player has a body.
The body is made up of body parts.

Each body part has:
 - a type: e.g. head, arms etc.
 - a sprite/display image
 - a position (coordinate at which the body part display will be centered)

For now, the body parts in this game are:
 - Head
 - Torso
 - Arms (one pair of arms is one body part)
 - Legs (one pair of legs is one body part)
 - Tail



### Future Ambitions:
Player will in some cases be able to have multiple of the same body part. For instance, a player class in which the player has three heads. For now we will keep it to one body part per body part node.



