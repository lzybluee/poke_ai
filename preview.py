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
                pokes[entry[1].split(' (')[0]] = '\n'.join(entry)
                entry = []
            else:
                entry.append(line.strip())


def get_stats(poke):
    name = poke.split('|')[3].split(', ')[0].replace('-*', '')
    return pokes[name]


def get_preview(p1, p2):
    with open('Teams_Preview.txt', 'w', encoding='utf8') as file:
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
