# P⃝O⃝W⃝E⃝R⃝🅑🅐🅛🅓

Powerball-like (with modifications) lottery contract implemented in [Fe](https://fe-lang.org). FOR EDUCATIONAL USE ONLY. NOT AUDITED OR LICENSED.

## Technical Description

### Picking balls

The domain of the balls being picked can be arbitrarily set during deployment. The size of the domain does not affect gas cost during draws or claims as we use a [Generalised Feistel Cipher](https://eprint.iacr.org/2010/301.pdf) to shuffle and pick balls without duplication.

The number of balls picked per game is set at 5 as a constant, but can also be arbitrarily changed in the code. The number of balls being drawn per game does slightly increase gas cost during claims.

### Checking winning ticket

Whenever a participant of the lottery attempts to claim a winning entry, a multiset equality check is performed between the drawn balls from the previous game and the participant's picks. For this, we utilise the [grand product check](https://hackmd.io/@arielg/ByFgSDA7D) from PLONK.

## Dependencies

Depends on the [feistel_shuffle_fe](https://github.com/kevincharm/feistel_shuffle_fe) lib, vendored as submodule. Use `git submodule && git submodule update` to install.
