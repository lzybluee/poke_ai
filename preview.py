import sys

pokes = {}

def load_data(gen):
    if gen:
        gen = gen.split('|')[-1]
    else:
        gen = '9'

    entry = []
    last = ''
    with open('../poke/zh_list/gen' + gen + '/Species.txt', 'r', encoding='utf8') as file:
        for line in file.readlines():
            if not line.strip() and entry:
                if ' (' not in entry[1]:
                    entry[1] += ' (' + last + '*)'
                else:
                    last = entry[1].split(' (')[1].replace(')', '')
                pokes[entry[1].split(' (')[0]] = '\n'.join(entry[1:])
                entry = []
            else:
                entry.append(line.strip())


def get_stats(poke):
    info = poke.split('|')[3].split(', ')
    name = info[0]
    while name not in pokes and '-' in name:
        name = name[0 : name.rfind('-')]
    level = '100'
    if len(info) > 1 and info[1].startswith('L'):
        level = info[1][1:]
    return 'Level ' + level + ('' if name == info[0] else ' [' + info[0] + ']') + '\n' + pokes[name]


def get_preview(p1, p2):
    with open('Teams_Preview.txt', 'w', encoding='utf8') as file:
        file.write('"' + sys.argv[1] + '"\n\n')
        file.write('[P1]' + '\n\n')
        for p in p1.split(';'):
            file.write(get_stats(p) + '\n\n')
        file.write('\n[P2]' + '\n\n')
        for p in p2.split(';'):
            file.write(get_stats(p) + '\n\n')


if __name__ == '__main__':
    args = sys.argv[1].split('#')
    load_data(args[0])
    get_preview(args[1], args[2])
