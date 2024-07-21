document.addEventListener('DOMContentLoaded', () => {
    const chapterCheckboxes = document.querySelectorAll('.chapter-checkbox');
    const verseCheckboxes = document.querySelectorAll('.verse-checkbox');

    chapterCheckboxes.forEach(chapterCheckbox => {
        chapterCheckbox.addEventListener('change', () => {
            const chapterId = chapterCheckbox.id;
            const verses = document.querySelectorAll(`.verse-checkbox[data-chapter="${chapterId}"]`);
            verses.forEach(verseCheckbox => {
                verseCheckbox.checked = chapterCheckbox.checked;
                saveProgress(chapterId, verseCheckbox.id, verseCheckbox.checked);
            });
        });
    });

    verseCheckboxes.forEach(verseCheckbox => {
        verseCheckbox.addEventListener('change', () => {
            const chapterId = verseCheckbox.getAttribute('data-chapter');
            const chapterCheckbox = document.getElementById(chapterId);
            const allVerses = document.querySelectorAll(`.verse-checkbox[data-chapter="${chapterId}"]`);
            const allChecked = Array.from(allVerses).every(checkbox => checkbox.checked);
            const someChecked = Array.from(allVerses).some(checkbox => checkbox.checked);
            chapterCheckbox.checked = allChecked;
            chapterCheckbox.indeterminate = !allChecked && someChecked;
            saveProgress(chapterId, verseCheckbox.id, verseCheckbox.checked);
        });
    });

    if (localStorage.getItem('token')) {
        document.getElementById('content').style.display = 'block';
        loadProgress();
    } else {
        window.location.href = 'login.html';
    }
});

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

function loadProgress() {
    fetch('/progress', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        data.forEach(item => {
            const checkbox = document.getElementById(`${item.livro}-${item.capitulo}-${item.versiculo}`);
            if (checkbox) {
                checkbox.checked = item.lido;
            }
        });
    });
}

function saveProgress(chapterId, verseId, isChecked) {
    fetch('/progress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ chapterId, verseId, isChecked })
    });
}
    