
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->decimal('price', 10, 2);
            $table->string('categoryId');
            $table->json('images');
            $table->json('sizes')->nullable();
            $table->json('colors')->nullable();
            $table->json('seoSettings')->nullable();
            $table->integer('stockQuantity')->default(0); // العمود الجديد
            $table->integer('salesCount')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('products');
    }
};
